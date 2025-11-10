import { prisma } from "./database.server";
import { FieldValidationError } from "./base.server";
import type { InteractionAction } from "@prisma/client";

interface ChatInputCredentials {
  phone_number: string;
  full_name: string;
  user_id: string;
  added_by_me: string;
}

interface SuccessResponse {
  message: string;
  success: boolean;
  user_id: string;
}

export async function createCustomerInteraction(
  customerId: string,
  modelId: string,
  actionType: InteractionAction
) {
  try {
    const existing = await prisma.customer_interactions.findUnique({
      where: {
        customerId_modelId_action: {
          customerId,
          modelId,
          action: actionType,
        },
      },
    });

    if (existing) {
      const res = await deleteCustomerInteraction(
        customerId,
        modelId,
        actionType
      );
      if (res.id) {
        return {
          success: true,
          error: false,
          message: "Unlike or unPass model successfull!",
        };
      }
    }

    const res1 = await prisma.customer_interactions.create({
      data: {
        customerId,
        modelId,
        action: actionType,
      },
    });

    if (res1.id) {
      return {
        success: true,
        error: false,
        message: "Like or Pass model successfull!",
      };
    }
  } catch (error: any) {
    console.log("CREATE_CUSTOMER_INTERACTIONS:", error);
    throw new FieldValidationError({
      success: false,
      error: true,
      message: error.message || "Failed to fetch create customer interaction!",
    });
  }
}

// CREATE CONTACT ON CHAT
async function createContact(
  userData: ChatInputCredentials,
  token: string
): Promise<SuccessResponse> {
  const url = "http://localhost:3000/api/add-contact-name";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }), // attach token if exists
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return {
      user_id: data.user_id,
      success: data.success,
      message: data.message,
    };
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

export async function customerAddFriend(
  adderId: string,
  contactId: string,
  token: string
) {
  try {
    const model = await prisma.model.findFirst({
      where: {
        id: contactId,
      },
    });

    console.log("PK MODEL:::", model);

    const existing = await prisma.friend_contacts.findUnique({
      where: {
        modelId_customerId: {
          customerId: adderId,
          modelId: contactId,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: true,
        message: "This user is already been friend!",
      };
    }

    const res = await prisma.friend_contacts.create({
      data: {
        adderType: "CUSTOMER",
        contactType: "MODEL",
        customerId: adderId,
        modelId: contactId,
      },
    });

    if (res.id) {
      const inputData: ChatInputCredentials = {
        phone_number: String(model?.whatsapp),
        full_name: model?.firstName + " " + model?.lastName,
        user_id: contactId,
        added_by_me: adderId,
      };

      const res = await createContact(inputData, token);

      if (res.success) {
        return {
          success: true,
          error: false,
          message: "Add friend success!",
        };
      }
    }
  } catch (error: any) {
    console.log("CUSTOMER_ADD_FRIEND:", error);
    throw new FieldValidationError({
      success: false,
      error: true,
      message: error.message || "Failed to add friend!",
    });
  }
}

export async function deleteCustomerInteraction(
  customerId: string,
  modelId: string,
  actionType: InteractionAction
) {
  try {
    return await prisma.customer_interactions.delete({
      where: {
        customerId_modelId_action: {
          customerId,
          modelId,
          action: actionType,
        },
      },
    });
  } catch (error: any) {
    console.log("DELETE_CUSTOMER_INTERACTIONS:", error);
    throw new FieldValidationError({
      success: false,
      error: true,
      message: error.message || "Failed to delete customer interaction!",
    });
  }
}
