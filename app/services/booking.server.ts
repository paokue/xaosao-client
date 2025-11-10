import { prisma } from "./database.server";
import { createAuditLogs } from "./log.server";
import { FieldValidationError } from "./base.server";
import type { IServiceBookingCredentials } from "~/interfaces/service";

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
    const result = await prisma.service_booking.create({
      data: {
        price: data.price,
        dayAmount: data.dayAmount,
        location: data.location,
        preferredAttire: data.preferred ?? "",
        startDate: data.startDate,
        endDate: data.endDate,
        status: "pending",
        customerId,
        modelId,
        modelServiceId,
      },
    });

    if (result.id) {
      await createAuditLogs({
        ...auditBase,
        description: `Create service booking: ${result.id} successfully.`,
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
        message: "Unauthorized to cancel this date booking!",
      });
    }

    if (booking.status !== "pending") {
      throw new FieldValidationError({
        success: false,
        error: true,
        message:
          "This date booking can't be cancel. Please contect admin to process!",
      });
    }

    const cancelServiceBooking = await prisma.service_booking.update({
      where: {
        id,
        customerId: customerId,
      },
      data: {
        status: "cancelled",
      },
    });

    if (cancelServiceBooking.id) {
      await createAuditLogs({
        ...auditBase,
        description: `Cancel service booking: ${cancelServiceBooking.id} successfully.`,
        status: "success",
        onSuccess: cancelServiceBooking,
      });
    }
    return cancelServiceBooking;
  } catch (error) {
    console.error("CANCEL_SERVICE_BOOKING_FAILED", error);
    await createAuditLogs({
      ...auditBase,
      description: `Cancel service booking failed!`,
      status: "failed",
      onError: error,
    });
    throw new FieldValidationError({
      success: false,
      error: true,
      message: "Failed to cancel service booking!",
    });
  }
}
