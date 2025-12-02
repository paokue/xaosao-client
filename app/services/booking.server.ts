import { prisma } from "./database.server";
import { createAuditLogs } from "./log.server";
import { FieldValidationError } from "./base.server";
import type { IServiceBookingCredentials } from "~/interfaces/service";

// ========================================
// Escrow Payment Helper Functions
// ========================================

/**
 * Hold payment from customer wallet for a booking
 */
async function holdPaymentFromCustomer(
  customerId: string,
  amount: number,
  bookingId: string
) {
  const wallet = await prisma.wallet.findFirst({
    where: { customerId, status: "active" },
  });

  if (!wallet) {
    throw new FieldValidationError({
      success: false,
      error: true,
      message: "Customer wallet not found!",
    });
  }

  if (wallet.totalBalance < amount) {
    throw new FieldValidationError({
      success: false,
      error: true,
      message: `Insufficient balance! You need ${amount.toLocaleString()} LAK but have ${wallet.totalBalance.toLocaleString()} LAK.`,
    });
  }

  const holdTransaction = await prisma.transaction_history.create({
    data: {
      identifier: "booking_hold",
      amount: -amount,
      status: "held",
      comission: 0,
      fee: 0,
      customerId,
      reason: `Payment held for booking #${bookingId}`,
    },
  });

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { totalBalance: wallet.totalBalance - amount },
  });

  return holdTransaction;
}

/**
 * Release held payment to model wallet
 */
async function releasePaymentToModel(
  modelId: string,
  amount: number,
  bookingId: string,
  holdTransactionId: string
) {
  const modelWallet = await prisma.wallet.findFirst({
    where: { modelId, status: "active" },
  });

  if (!modelWallet) {
    throw new FieldValidationError({
      success: false,
      error: true,
      message: "Model wallet not found!",
    });
  }

  await prisma.transaction_history.update({
    where: { id: holdTransactionId },
    data: { status: "released" },
  });

  const earningTransaction = await prisma.transaction_history.create({
    data: {
      identifier: "booking_earning",
      amount: amount,
      status: "approved",
      comission: 0,
      fee: 0,
      modelId,
      reason: `Earning from completed booking #${bookingId}`,
    },
  });

  await prisma.wallet.update({
    where: { id: modelWallet.id },
    data: {
      totalBalance: modelWallet.totalBalance + amount,
      totalDeposit: modelWallet.totalDeposit + amount,
    },
  });

  return earningTransaction;
}

/**
 * Refund held payment back to customer
 */
async function refundPaymentToCustomer(
  customerId: string,
  amount: number,
  bookingId: string,
  holdTransactionId: string,
  reason: string
) {
  const wallet = await prisma.wallet.findFirst({
    where: { customerId, status: "active" },
  });

  if (!wallet) {
    throw new FieldValidationError({
      success: false,
      error: true,
      message: "Customer wallet not found!",
    });
  }

  await prisma.transaction_history.update({
    where: { id: holdTransactionId },
    data: { status: "refunded" },
  });

  const refundTransaction = await prisma.transaction_history.create({
    data: {
      identifier: "booking_refund",
      amount: amount,
      status: "approved",
      comission: 0,
      fee: 0,
      customerId,
      reason: `Refund for booking #${bookingId}: ${reason}`,
    },
  });

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { totalBalance: wallet.totalBalance + amount },
  });

  return refundTransaction;
}

/**
 * Check if booking can be cancelled (2 hours before start time rule)
 */
export function canCancelBooking(startDate: Date): { canCancel: boolean; message: string } {
  const now = new Date();
  const bookingStart = new Date(startDate);
  const hoursUntilBooking = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilBooking < 2) {
    return {
      canCancel: false,
      message: "Cannot cancel within 2 hours of booking start time. Please contact support.",
    };
  }

  return { canCancel: true, message: "" };
}

// ========================================
// Booking CRUD Functions
// ========================================

export async function createServiceBooking(
  customerId: string,
  modelId: string,
  modelServiceId: string,
  data: IServiceBookingCredentials
) {
  const auditBase = {
    action: "CREATE_SERVICE_BOOKING",
    customer: customerId,
  };

  try {
    // First, hold the payment from customer wallet
    const holdTransaction = await holdPaymentFromCustomer(customerId, data.price, "pending");

    // Create booking with payment held
    const result = await prisma.service_booking.create({
      data: {
        price: data.price,
        dayAmount: data.dayAmount,
        location: data.location,
        preferredAttire: data.preferred ?? "",
        startDate: data.startDate,
        endDate: data.endDate,
        status: "pending",
        paymentStatus: "held",
        holdTransactionId: holdTransaction.id,
        customerId,
        modelId,
        modelServiceId,
      },
    });

    // Update transaction with actual booking ID
    await prisma.transaction_history.update({
      where: { id: holdTransaction.id },
      data: { reason: `Payment held for booking #${result.id}` },
    });

    if (result.id) {
      await createAuditLogs({
        ...auditBase,
        description: `Create service booking: ${result.id} with payment held successfully.`,
        status: "success",
        onSuccess: result,
      });
    }
    return result;
  } catch (error) {
    console.error("CREATE_SERVICE_BOOKING_FAILED", error);
    await createAuditLogs({
      ...auditBase,
      description: `Create service booking failed!`,
      status: "failed",
      onError: error,
    });

    if (error instanceof FieldValidationError) {
      throw error;
    }

    throw new FieldValidationError({
      success: false,
      error: true,
      message: "Failed to create service booking!",
    });
  }
}

export async function updateServiceBooking(
  id: string,
  customerId: string,
  data: IServiceBookingCredentials
) {
  const auditBase = {
    action: "UPDATE_SERVICE_BOOKING",
    customer: customerId,
  };

  try {
    const result = await prisma.service_booking.update({
      where: {
        id,
      },
      data: {
        price: data.price,
        dayAmount: data.dayAmount,
        location: data.location,
        preferredAttire: data.preferred ?? "",
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });

    if (result.id) {
      await createAuditLogs({
        ...auditBase,
        description: `Update service booking: ${result.id} successfully.`,
        status: "success",
        onSuccess: result,
      });
    }
    return result;
  } catch (error) {
    console.error("UPDATE_SERVICE_BOOKING_FAILED", error);
    await createAuditLogs({
      ...auditBase,
      description: `Update service booking failed!`,
      status: "failed",
      onError: error,
    });
    throw new FieldValidationError({
      success: false,
      error: true,
      message: "Failed to update service booking!",
    });
  }
}

// export async function getAllMyServiceBookings(customerId: string) {
//   try {
//     return await prisma.service_booking.findMany({
//       where: {
//         customerId,
//       },
//       take: 20,
//       select: {
//         id: true,
//         price: true,
//         location: true,
//         preferredAttire: true,
//         startDate: true,
//         endDate: true,
//         status: true,
//         dayAmount: true,
//         model: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             profile: true,
//             dob: true,
//             friend_contacts: {
//               where: {
//                 adderType: "CUSTOMER",
//                 customerId: customerId,
//                 contactType: "MODEL",
//               },
//               select: {
//                 id: true,
//                 modelId: true,
//                 contactType: true,
//               },
//             },
//           },
//         },
//         modelService: {
//           select: {
//             id: true,
//             customRate: true,
//             service: {
//               select: {
//                 id: true,
//                 name: true,
//                 description: true,
//                 baseRate: true,
//               },
//             },
//           },
//         },
//       },
//     });
//   } catch (error: any) {
//     console.error("GET_ALL_MY_SERVICE_BOOKING", error);
//     throw new Error("Failed to query service booking!");
//   }
// }
export async function getAllMyServiceBookings(customerId: string) {
  try {
    const bookings = await prisma.service_booking.findMany({
      where: {
        customerId,
      },
      take: 20,
      select: {
        id: true,
        price: true,
        location: true,
        preferredAttire: true,
        startDate: true,
        endDate: true,
        status: true,
        dayAmount: true,
        model: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: true,
            dob: true,
            friend_contacts: {
              where: {
                adderType: "CUSTOMER",
                customerId,
                contactType: "MODEL",
              },
              select: {
                id: true,
                modelId: true,
                contactType: true,
              },
            },
          },
        },
        modelService: {
          select: {
            id: true,
            customRate: true,
            service: {
              select: {
                id: true,
                name: true,
                description: true,
                baseRate: true,
              },
            },
          },
        },
      },
    });

    // 🧠 Add computed field
    return bookings.map((booking) => ({
      ...booking,
      isContact: !!booking.model?.friend_contacts?.length,
    }));
  } catch (error: any) {
    console.error("GET_ALL_MY_SERVICE_BOOKING", error);
    throw new Error("Failed to query service booking!");
  }
}

export async function getAllMyServiceBooking(id: string) {
  try {
    return await prisma.service_booking.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        price: true,
        location: true,
        preferredAttire: true,
        startDate: true,
        endDate: true,
        status: true,
        dayAmount: true,
        modelId: true,
        modelServiceId: true,
      },
    });
  } catch (error: any) {
    console.error("GET_MY_SERVICE_BOOKING", error);
    throw new Error("Failed to query service booking!");
  }
}

export async function getMyServiceBookingDetail(id: string) {
  try {
    return await prisma.service_booking.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        price: true,
        location: true,
        preferredAttire: true,
        startDate: true,
        endDate: true,
        status: true,
        dayAmount: true,
        model: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dob: true,
            profile: true,
          },
        },
        modelService: {
          select: {
            id: true,
            service: {
              select: {
                id: true,
                name: true,
                description: true,
                baseRate: true,
              },
            },
          },
        },
      },
    });
  } catch (error: any) {
    console.error("GET_MY_SERVICE_BOOKING", error);
    throw new Error("Failed to query service booking!");
  }
}

export async function deleteServiceBooking(id: string, customerId: string) {
  if (!id) throw new Error("Missing service booking id!");
  if (!customerId) throw new Error("Missing customer id!");

  const auditBase = {
    action: "DELETE_SERVICE_BOOKING",
    customer: customerId,
  };

  try {
    const booking = await prisma.service_booking.findUnique({
      where: {
        id,
      },
    });

    if (!booking) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "The service booking does not exist!",
      });
    }

    if (booking.customerId !== customerId) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "Unauthorized to delete this date booking!",
      });
    }

    if (booking.status == "pending") {
      throw new FieldValidationError({
        success: false,
        error: true,
        message:
          "This date booking can't be deleted. Please contect admin to process!",
      });
    }

    const deletedServiceBooking = await prisma.service_booking.delete({
      where: {
        id,
        customerId: customerId,
      },
    });

    if (deletedServiceBooking.id) {
      await createAuditLogs({
        ...auditBase,
        description: `Delete service booking: ${deletedServiceBooking.id} successfully.`,
        status: "success",
        onSuccess: deletedServiceBooking,
      });
    }
    return deletedServiceBooking;
  } catch (error) {
    console.error("DELETE_SERVICE_BOOKING_FAILED", error);
    await createAuditLogs({
      ...auditBase,
      description: `Delete service booking failed!`,
      status: "failed",
      onError: error,
    });
    throw new FieldValidationError({
      success: false,
      error: true,
      message: "Failed to delete service booking!",
    });
  }
}

export async function cancelServiceBooking(id: string, customerId: string) {
  if (!id) throw new Error("Missing service booking id!");
  if (!customerId) throw new Error("Missing customer id!");

  const auditBase = {
    action: "CANCEL_SERVICE_BOOKING",
    customer: customerId,
  };

  try {
    const booking = await prisma.service_booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "The service booking does not exist!",
      });
    }

    if (booking.customerId !== customerId) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "Unauthorized to cancel this date booking!",
      });
    }

    // Only pending or confirmed bookings can be cancelled
    if (booking.status !== "pending" && booking.status !== "confirmed") {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "This booking cannot be cancelled. Please contact support.",
      });
    }

    // Check 2-hour cancellation rule
    const cancelCheck = canCancelBooking(booking.startDate);
    if (!cancelCheck.canCancel) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: cancelCheck.message,
      });
    }

    // Refund payment if held
    if (booking.paymentStatus === "held" && booking.holdTransactionId) {
      await refundPaymentToCustomer(
        customerId,
        booking.price,
        booking.id,
        booking.holdTransactionId,
        "Booking cancelled by customer"
      );
    }

    const cancelledBooking = await prisma.service_booking.update({
      where: { id, customerId },
      data: {
        status: "cancelled",
        paymentStatus: "refunded",
      },
    });

    if (cancelledBooking.id) {
      await createAuditLogs({
        ...auditBase,
        description: `Cancel service booking: ${cancelledBooking.id} with refund successfully.`,
        status: "success",
        onSuccess: cancelledBooking,
      });
    }
    return cancelledBooking;
  } catch (error) {
    console.error("CANCEL_SERVICE_BOOKING_FAILED", error);
    await createAuditLogs({
      ...auditBase,
      description: `Cancel service booking failed!`,
      status: "failed",
      onError: error,
    });

    if (error instanceof FieldValidationError) {
      throw error;
    }

    throw new FieldValidationError({
      success: false,
      error: true,
      message: "Failed to cancel service booking!",
    });
  }
}

// ========================================
// Model Dating / Booking Functions
// ========================================

/**
 * Get all bookings for a model
 */
export async function getAllModelBookings(modelId: string) {
  try {
    const bookings = await prisma.service_booking.findMany({
      where: {
        modelId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      select: {
        id: true,
        price: true,
        location: true,
        preferredAttire: true,
        startDate: true,
        endDate: true,
        status: true,
        dayAmount: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: true,
            dob: true,
            whatsapp: true,
            friend_contacts: {
              where: {
                modelId,
              },
              select: {
                id: true,
              },
            },
          },
        },
        modelService: {
          select: {
            id: true,
            customRate: true,
            service: {
              select: {
                id: true,
                name: true,
                description: true,
                baseRate: true,
              },
            },
          },
        },
      },
    });

    return bookings.map((booking) => ({
      ...booking,
      isContact: !!booking.customer?.friend_contacts?.length,
    }));
  } catch (error: any) {
    console.error("GET_ALL_MODEL_BOOKINGS", error);
    throw new Error("Failed to query model bookings!");
  }
}

/**
 * Get booking detail for model
 */
export async function getModelBookingDetail(id: string, modelId: string) {
  try {
    return await prisma.service_booking.findFirst({
      where: {
        id,
        modelId,
      },
      select: {
        id: true,
        price: true,
        location: true,
        preferredAttire: true,
        startDate: true,
        endDate: true,
        status: true,
        dayAmount: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: true,
            dob: true,
            whatsapp: true,
            gender: true,
          },
        },
        modelService: {
          select: {
            id: true,
            customRate: true,
            service: {
              select: {
                id: true,
                name: true,
                description: true,
                baseRate: true,
              },
            },
          },
        },
      },
    });
  } catch (error: any) {
    console.error("GET_MODEL_BOOKING_DETAIL", error);
    throw new Error("Failed to query booking detail!");
  }
}

/**
 * Accept booking (Model accepts a customer's booking request)
 */
export async function acceptBooking(id: string, modelId: string) {
  if (!id) throw new Error("Missing booking id!");
  if (!modelId) throw new Error("Missing model id!");

  const auditBase = {
    action: "ACCEPT_BOOKING",
    model: modelId,
  };

  try {
    const booking = await prisma.service_booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "The booking does not exist!",
      });
    }

    if (booking.modelId !== modelId) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "Unauthorized to accept this booking!",
      });
    }

    if (booking.status !== "pending") {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "Only pending bookings can be accepted!",
      });
    }

    const updatedBooking = await prisma.service_booking.update({
      where: { id },
      data: { status: "confirmed" },
    });

    if (updatedBooking.id) {
      await createAuditLogs({
        ...auditBase,
        description: `Accept booking: ${updatedBooking.id} successfully.`,
        status: "success",
        onSuccess: updatedBooking,
      });
    }

    return updatedBooking;
  } catch (error) {
    console.error("ACCEPT_BOOKING_FAILED", error);
    await createAuditLogs({
      ...auditBase,
      description: `Accept booking failed!`,
      status: "failed",
      onError: error,
    });
    throw error;
  }
}

/**
 * Reject booking (Model rejects a customer's booking request)
 * Automatically refunds the held payment to customer
 */
export async function rejectBooking(id: string, modelId: string, reason?: string) {
  if (!id) throw new Error("Missing booking id!");
  if (!modelId) throw new Error("Missing model id!");

  const auditBase = {
    action: "REJECT_BOOKING",
    model: modelId,
  };

  try {
    const booking = await prisma.service_booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "The booking does not exist!",
      });
    }

    if (booking.modelId !== modelId) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "Unauthorized to reject this booking!",
      });
    }

    if (booking.status !== "pending") {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "Only pending bookings can be rejected!",
      });
    }

    // Refund payment to customer if held
    if (booking.paymentStatus === "held" && booking.holdTransactionId) {
      await refundPaymentToCustomer(
        booking.customerId,
        booking.price,
        booking.id,
        booking.holdTransactionId,
        reason || "Booking rejected by model"
      );
    }

    const updatedBooking = await prisma.service_booking.update({
      where: { id },
      data: {
        status: "rejected",
        paymentStatus: "refunded",
        rejectReason: reason || null,
      },
    });

    if (updatedBooking.id) {
      await createAuditLogs({
        ...auditBase,
        description: `Reject booking: ${updatedBooking.id} with refund successfully. Reason: ${reason || "No reason provided"}`,
        status: "success",
        onSuccess: updatedBooking,
      });
    }

    return updatedBooking;
  } catch (error) {
    console.error("REJECT_BOOKING_FAILED", error);
    await createAuditLogs({
      ...auditBase,
      description: `Reject booking failed!`,
      status: "failed",
      onError: error,
    });

    if (error instanceof FieldValidationError) {
      throw error;
    }

    throw new FieldValidationError({
      success: false,
      error: true,
      message: "Failed to reject booking!",
    });
  }
}

/**
 * Delete booking (Model deletes a rejected booking)
 */
export async function deleteModelBooking(id: string, modelId: string) {
  if (!id) throw new Error("Missing booking id!");
  if (!modelId) throw new Error("Missing model id!");

  const auditBase = {
    action: "DELETE_MODEL_BOOKING",
    model: modelId,
  };

  try {
    const booking = await prisma.service_booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "The booking does not exist!",
      });
    }

    if (booking.modelId !== modelId) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "Unauthorized to delete this booking!",
      });
    }

    if (booking.status !== "rejected") {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "Only rejected bookings can be deleted!",
      });
    }

    const deletedBooking = await prisma.service_booking.delete({
      where: { id },
    });

    if (deletedBooking.id) {
      await createAuditLogs({
        ...auditBase,
        description: `Delete booking: ${deletedBooking.id} successfully.`,
        status: "success",
        onSuccess: deletedBooking,
      });
    }

    return deletedBooking;
  } catch (error) {
    console.error("DELETE_MODEL_BOOKING_FAILED", error);
    await createAuditLogs({
      ...auditBase,
      description: `Delete booking failed!`,
      status: "failed",
      onError: error,
    });
    throw new FieldValidationError({
      success: false,
      error: true,
      message: "Failed to delete booking!",
    });
  }
}

/**
 * Complete booking (Model marks the date as completed after service is done)
 * Releases the held payment to model's wallet
 */
export async function completeBooking(id: string, modelId: string) {
  if (!id) throw new Error("Missing booking id!");
  if (!modelId) throw new Error("Missing model id!");

  const auditBase = {
    action: "COMPLETE_BOOKING",
    model: modelId,
  };

  try {
    const booking = await prisma.service_booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "The booking does not exist!",
      });
    }

    if (booking.modelId !== modelId) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "Unauthorized to complete this booking!",
      });
    }

    if (booking.status !== "confirmed") {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "Only confirmed bookings can be marked as completed!",
      });
    }

    // Check if booking date has passed (cannot complete before the date)
    const now = new Date();
    const bookingStart = new Date(booking.startDate);
    if (now < bookingStart) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "Cannot complete booking before the scheduled date!",
      });
    }

    // Release payment to model if held
    let releaseTransaction = null;
    if (booking.paymentStatus === "held" && booking.holdTransactionId) {
      releaseTransaction = await releasePaymentToModel(
        modelId,
        booking.price,
        booking.id,
        booking.holdTransactionId
      );
    }

    const completedBooking = await prisma.service_booking.update({
      where: { id },
      data: {
        status: "completed",
        paymentStatus: "released",
        completedAt: new Date(),
        releaseTransactionId: releaseTransaction?.id || null,
      },
    });

    if (completedBooking.id) {
      await createAuditLogs({
        ...auditBase,
        description: `Complete booking: ${completedBooking.id} with payment released successfully.`,
        status: "success",
        onSuccess: completedBooking,
      });
    }

    return completedBooking;
  } catch (error) {
    console.error("COMPLETE_BOOKING_FAILED", error);
    await createAuditLogs({
      ...auditBase,
      description: `Complete booking failed!`,
      status: "failed",
      onError: error,
    });

    if (error instanceof FieldValidationError) {
      throw error;
    }

    throw new FieldValidationError({
      success: false,
      error: true,
      message: "Failed to complete booking!",
    });
  }
}
