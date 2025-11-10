import { prisma } from "./database.server";
import type { Prisma } from "@prisma/client";
import { createAuditLogs } from "./log.server";
import { UserStatus } from "~/interfaces/base";
import { FieldValidationError } from "./base.server";
import type { IWalletCredentials } from "~/interfaces";
import type { ITransactionCredentials } from "~/interfaces/transaction";

// create wallet when user register
export async function createWallet(data: IWalletCredentials, userId: string) {
  if (!data) throw new Error("Missing model creation data!");

  const auditBase = {
    action: "CREATE_WALLET",
    customer: userId,
  };

  try {
    const orConditions: Prisma.walletWhereInput[] = [];
    if (data.customer) {
      orConditions.push({ customer: { id: data.customer } });
    }
    if (data.model) {
      orConditions.push({ model: { id: data.model } });
    }

    const existingWallet = await prisma.wallet.findFirst({
      where: {
        OR: orConditions.length > 0 ? orConditions : undefined,
      },
    });

    if (existingWallet) {
      const error = new Error("The wallet already exists!") as any;
      error.status = 422;
      throw error;
    }

    const wallet = await prisma.wallet.create({
      data: {
        totalBalance: 0,
        totalRecharge: 0,
        totalDeposit: 0,
        status: UserStatus.ACTIVE,
        ...(data.customer && { customer: { connect: { id: data.customer } } }),
        ...(data.model && { model: { connect: { id: data.model } } }),
      },
    });

    if (wallet.id) {
      await createAuditLogs({
        ...auditBase,
        description: `Create wallet: ${wallet.id} successfully.`,
        status: "success",
        onSuccess: wallet,
      });
    }

    return wallet;
  } catch (error) {
    console.error("CREATE_WALLET_FAILED", error);
    await createAuditLogs({
      ...auditBase,
      description: `Crate wallet failed!`,
      status: "failed",
      onError: error,
    });
    throw new Error("Failed to create wallet account!");
  }
}

// top-up money to user wallet
export async function topUpWallet(
  paymentSlip: string,
  amount: number,
  userId: string
) {
  if (!amount || amount <= 0) throw new Error("Invalid top-up amount!");

  const auditBase = {
    action: "TOPUP_WALLET",
    customer: userId,
  };

  try {
    const customerData = await prisma.customer.findUnique({
      where: {
        id: userId,
      },
      include: {
        Wallet: {
          select: {
            id: true,
          },
        },
      },
    });

    const walletId = customerData?.Wallet?.[0]?.id;

    if (!walletId)
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "Wallet id is missing!",
      });

    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "The wallet does not exist!",
      });
    }

    const createTopUpTransaction = await prisma.transaction_history.create({
      data: {
        identifier: "recharge",
        amount,
        paymentSlip,
        status: "pending",
        comission: 0,
        fee: 0,
        customerId: userId,
      },
    });

    if (createTopUpTransaction.id) {
      await createAuditLogs({
        ...auditBase,
        description: `Top-up wallet: ${createTopUpTransaction.id} successfully.`,
        status: "success",
        onSuccess: createTopUpTransaction,
      });
    }
    return createTopUpTransaction;
  } catch (error) {
    console.error("TOPUP_WALLET_FAILED", error);
    await createAuditLogs({
      ...auditBase,
      description: `Top-up wallet failed!`,
      status: "failed",
      onError: error,
    });
    throw new FieldValidationError({
      success: false,
      error: true,
      message: "Failed to top-up wallet account!",
    });
  }
}

// get customer transactions with pagination
export async function getCustomerTransactions(
  customerId: string,
  page: number = 1,
  limit: number = 10
) {
  if (!customerId) throw new Error("Missing customer id!");
  if (page < 1) page = 1;
  if (limit < 1) limit = 10;

  const skip = (page - 1) * limit;

  try {
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction_history.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction_history.count({
        where: { customerId },
      }),
    ]);

    return {
      transactions,
      pagination: {
        currentPage: page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: skip + limit < totalCount,
        hasPreviousPage: page > 1,
      },
    };
  } catch (error) {
    console.error("GET_CUSTOMER_TRANSACTIONS_FAILED", error);
    throw new FieldValidationError({
      success: false,
      error: true,
      message: "Failed to get customer transactions!",
    });
  }
}

// get single transaction by id
export async function getTransaction(id: string, customerId: string) {
  try {
    return await prisma.transaction_history.findFirst({
      where: { id, customerId: customerId },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("GET_TRANSACTIONS_FAILED", error);
    throw new FieldValidationError({
      success: false,
      error: true,
      message: "Failed to fetch transactions!",
    });
  }
}

// delete transaction by id
export async function deleteTransaction(
  transactionId: string,
  customerId: string
) {
  if (!customerId) throw new Error("Missing customer id!");
  if (!transactionId) throw new Error("Missing transaction id!");

  const auditBase = {
    action: "DELETE_TRANSACTION",
    customer: customerId,
  };

  try {
    const transaction = await prisma.transaction_history.findUnique({
      where: {
        id: transactionId,
      },
    });

    if (!transaction) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "The transaction does not exist!",
      });
    }

    if (transaction.customerId !== customerId) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "Unauthorized to delete this transaction!",
      });
    }

    if (
      transaction.status === "approved" ||
      transaction.status === "rejected"
    ) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message:
          "This transaction can't be deleted. Please contect admin to process!",
      });
    }

    const deletedTransaction = await prisma.transaction_history.delete({
      where: { id: transactionId },
    });

    if (deletedTransaction.id) {
      await createAuditLogs({
        ...auditBase,
        description: `Delete transaction: ${deletedTransaction.id} successfully.`,
        status: "success",
        onSuccess: deletedTransaction,
      });
    }
    return deletedTransaction;
  } catch (error) {
    console.error("DELETE_TRANSACTION_FAILED", error);
    await createAuditLogs({
      ...auditBase,
      description: `Delete transaction failed!`,
      status: "failed",
      onError: error,
    });
    throw new FieldValidationError({
      success: false,
      error: true,
      message: "Failed to delete transaction!",
    });
  }
}

// update transaction by id
export async function updateTransaction(
  transactionId: string,
  customerId: string,
  transactionData: ITransactionCredentials
) {
  if (!customerId) throw new Error("Missing customer id!");
  if (!transactionId) throw new Error("Missing transaction id!");

  const auditBase = {
    action: "UPDATE_TRANSACTION",
    customer: customerId,
  };

  try {
    const transaction = await prisma.transaction_history.findUnique({
      where: {
        id: transactionId,
      },
    });

    if (!transaction) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "The transaction does not exist!",
      });
    }

    if (transaction.customerId !== customerId) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "Unauthorized to edit this transaction!",
      });
    }

    const updateTransaction = await prisma.transaction_history.update({
      where: { id: transactionId },
      data: {
        amount: +transactionData.amount,
        paymentSlip: transactionData.paymentSlip,
      },
    });

    if (updateTransaction.id) {
      await createAuditLogs({
        ...auditBase,
        description: `Edit transaction: ${updateTransaction.id} successfully.`,
        status: "success",
        onSuccess: updateTransaction,
      });
    }
    return updateTransaction;
  } catch (error: any) {
    console.error("UPDATE_TRANSACTION_FAILED", error);
    await createAuditLogs({
      ...auditBase,
      description: `Delete transaction failed!`,
      status: "failed",
      onError: error,
    });
    throw new FieldValidationError({
      success: false,
      error: true,
      message: "Failed to update top-up information!",
    });
  }
}

// get wallet by customer id
export async function getWalletByCustomerId(customerId: string) {
  if (!customerId) throw new Error("Missing customer id!");

  console.log(customerId);
  try {
    const wallet = await prisma.wallet.findFirst({
      where: {
        customerId,
        status: "active",
      },
    });

    if (!wallet) {
      const error = new Error("The wallet does not exist!") as any;
      error.status = 404;
      throw error;
    }

    return wallet;
  } catch (error) {
    console.error("GET_WALLET_FAILED", error);
    throw new FieldValidationError({
      success: false,
      error: true,
      message: "Failed to get wallet!",
    });
  }
}

// deduct balance from wallet for subscription payment
export async function deductFromWallet(
  customerId: string,
  amount: number,
  planId: string,
  planName: string
) {
  if (!customerId) throw new Error("Missing customer id!");
  if (!amount || amount <= 0) throw new Error("Invalid deduction amount!");

  const auditBase = {
    action: "WALLET_DEDUCTION",
    customer: customerId,
  };

  try {
    const wallet = await prisma.wallet.findFirst({
      where: {
        customerId,
        status: "active",
      },
    });

    if (!wallet) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "Wallet not found!",
      });
    }

    if (wallet.totalBalance < amount) {
      throw new FieldValidationError({
        success: false,
        error: true,
        message: "Insufficient wallet balance!",
      });
    }

    // Deduct from wallet balance and update totalDeposit
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        totalBalance: wallet.totalBalance - amount,
        totalDeposit: wallet.totalDeposit + amount,
      },
    });

    // Create transaction record with approved status
    const transaction = await prisma.transaction_history.create({
      data: {
        identifier: "subscription",
        amount: amount,
        paymentSlip: null, // No payment slip needed for wallet payment
        status: "approved",
        comission: 0,
        fee: 0,
        customerId,
        reason: `Subscription payment for ${planName} (Plan ID: ${planId})`,
      },
    });

    if (transaction.id) {
      await createAuditLogs({
        ...auditBase,
        description: `Wallet deduction: ${transaction.id} - ${amount} for subscription ${planName}`,
        status: "success",
        onSuccess: { transaction, updatedWallet },
      });
    }

    return { wallet: updatedWallet, transaction };
  } catch (error) {
    console.error("WALLET_DEDUCTION_FAILED", error);
    await createAuditLogs({
      ...auditBase,
      description: `Wallet deduction failed!`,
      status: "failed",
      onError: error,
    });

    // Re-throw FieldValidationError as-is
    if (error instanceof FieldValidationError) {
      throw error;
    }

    throw new FieldValidationError({
      success: false,
      error: true,
      message: "Failed to deduct from wallet!",
    });
  }
}
