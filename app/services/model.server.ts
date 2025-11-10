import { prisma } from "./database.server";
import { differenceInYears } from "date-fns";
import { FieldValidationError } from "./base.server";

interface ForYouFilters {
  gender?: string;
  location?: string;
  minRating?: number;
  relationshipStatus?: string;
  ageRange?: [number, number];
  maxDistance?: number;
  customerLat?: number;
  customerLng?: number;
  page?: number;
  perPage?: number;
}

// Discover page
export async function getModelsForCustomer(customerId: string) {
  try {
    const models = await prisma.model.findMany({
      where: {
        status: "active",
        customer_interactions: {
          none: {
            customerId,
            action: "PASS",
          },
        },
      },
      take: 20,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dob: true,
        gender: true,
        bio: true,
        whatsapp: true,
        address: true,
        profile: true,
        rating: true,
        latitude: true,
        longitude: true,
        available_status: true,
        createdAt: true,
        Images: {
          where: { status: "active" },
          select: { id: true, name: true },
        },
        customer_interactions: {
          where: { customerId },
          select: { action: true },
        },
        friend_contacts: {
          where: {
            adderType: "CUSTOMER",
            customerId: customerId,
            contactType: "MODEL",
          },
          select: {
            id: true,
            modelId: true,
            contactType: true,
          },
        },
      },
    });

    return models.map((model) => ({
      ...model,
      customerAction:
        model.customer_interactions.length > 0
          ? model.customer_interactions[0].action
          : null,
      isContact: model.friend_contacts.length > 0,
    }));
  } catch (error: any) {
    console.error("GET_MODELS_FOR_CUSTOMER_ERROR:", error);
    throw new FieldValidationError({
      success: false,
      error: true,
      message: error.message || "Failed to fetch models!",
    });
  }
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getNearbyModels(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { latitude: true, longitude: true },
  });

  if (!customer?.latitude || !customer?.longitude)
    throw new Error("Customer location missing");

  const models = await prisma.model.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      status: "active",
    },
    take: 20,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dob: true,
      profile: true,
      latitude: true,
      longitude: true,
      status: true,
      available_status: true,
      Images: {
        take: 3,
        where: { status: "active" },
        select: { id: true, name: true },
      },
      friend_contacts: {
        where: {
          adderType: "CUSTOMER",
          customerId: customerId,
          contactType: "MODEL",
        },
        select: {
          id: true,
          modelId: true,
          contactType: true,
        },
      },
    },
  });

  const sorted = models
    .map((m) => {
      const distance = calculateDistance(
        customer.latitude!,
        customer.longitude!,
        m.latitude!,
        m.longitude!
      );

      return {
        ...m,
        distance: Number(distance.toFixed(2)),
        isContact: m.friend_contacts.length > 0,
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 9);

  return sorted;
}

// Get model profile data by id and customer id
export async function getHotModels(customerId: string) {
  try {
    const hotModels = await prisma.model.findMany({
      where: {
        status: "active",
      },
      take: 10,
      orderBy: {
        model_interactions: {
          _count: "desc",
        },
      },
      include: {
        _count: {
          select: {
            model_interactions: {
              where: {
                action: "LIKE",
              },
            },
          },
        },
        Images: {
          take: 1,
          where: {
            status: "active",
          },
          select: {
            id: true,
            name: true,
          },
        },
        friend_contacts: {
          where: {
            adderType: "CUSTOMER",
            customerId: customerId,
            contactType: "MODEL",
          },
          select: {
            id: true,
            modelId: true,
            contactType: true,
          },
        },
      },
    });

    return hotModels.map((model) => ({
      ...model,
      likeCount: model._count.model_interactions,
      isContact: model.friend_contacts.length > 0,
    }));
  } catch (error: any) {
    console.log("GET_HOT_MODELS_ERROR:", error);
    throw new FieldValidationError({
      success: false,
      error: true,
      message: error.message || "Failed to fetch hot models!",
    });
  }
}

export async function getModelProfile(modelId: string, customerId: string) {
  try {
    const model = await prisma.model.findFirst({
      where: {
        id: modelId,
        status: "active",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dob: true,
        gender: true,
        latitude: true,
        longitude: true,
        address: true,
        available_status: true,
        profile: true,
        status: true,
        rating: true,
        total_review: true,
        createdAt: true,
        career: true,
        education: true,
        relationshipStatus: true,
        interests: true,
        bio: true,
        Images: {
          where: { status: "active" },
          select: { id: true, name: true },
        },
        friend_contacts: {
          where: {
            adderType: "CUSTOMER",
            customerId,
            contactType: "MODEL",
          },
          select: { id: true, modelId: true, contactType: true },
        },
        ModelService: {
          where: { status: "active" },
          select: {
            id: true,
            customRate: true,
            isAvailable: true,
            minSessionDuration: true,
            maxSessionDuration: true,
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
        customer_interactions: {
          where: { customerId },
          select: { action: true },
        },
        // 👇 Add count fields directly using Prisma's relation count
        _count: {
          select: {
            friend_contacts: true,
            customer_interactions: true,
          },
        },
      },
    });

    if (!model) return null;

    // Derive extra fields
    return {
      ...model,
      isContact: model.friend_contacts.length > 0,
      customerAction:
        model.customer_interactions.length > 0
          ? model.customer_interactions[0].action
          : null,
      totalFriends: model._count.friend_contacts,
      totalLikes: model._count.customer_interactions,
    };
  } catch (error: any) {
    console.error("GET_MODEL_DATA_ERROR:", error);
    throw new FieldValidationError({
      success: false,
      error: true,
      message: error.message || "Failed to fetch model profile!",
    });
  }
}

// Get model service for book:
export async function getModelService(modelId: string, serviceId: string) {
  try {
    return await prisma.model_service.findFirst({
      where: {
        id: serviceId,
        modelId: modelId,
        status: "active",
      },
      select: {
        id: true,
        customRate: true,
        isAvailable: true,
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            baseRate: true,
          },
        },
      },
    });
  } catch (error: any) {
    console.error("GET_MODEL_SERVICE_ERROR:", error);
    throw new FieldValidationError({
      success: false,
      error: true,
      message: error.message || "Failed to fetch model service!",
    });
  }
}

export async function getModel(id: string) {
  try {
    return await prisma.model.findFirst({
      where: {
        id,
        status: "active",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });
  } catch (error: any) {
    console.log("GET_MODEL_DATA_ERROR:", error);
    throw new FieldValidationError({
      success: false,
      error: true,
      message: error.message || "Failed to fetch hot model!",
    });
  }
}

// Match page: ================
export async function getForyouModels(
  customerId: string,
  filters: ForYouFilters = {}
) {
  try {
    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 20;
    const skip = (page - 1) * perPage;

    // Count total first (without pagination)
    const totalCount = await prisma.model.count({
      where: {
        status: "active",
        ...(filters.gender ? { gender: filters.gender } : {}),
        ...(filters.location
          ? { address: { contains: filters.location } }
          : {}),
        ...(filters.minRating ? { rating: { gte: filters.minRating } } : {}),
        ...(filters.relationshipStatus
          ? { available_status: filters.relationshipStatus }
          : {}),
        NOT: {
          customer_interactions: {
            some: {
              customerId,
              action: "PASS",
            },
          },
        },
      },
    });

    // Fetch models with pagination
    const models = await prisma.model.findMany({
      skip,
      take: perPage,
      where: {
        status: "active",
        ...(filters.gender ? { gender: filters.gender } : {}),
        ...(filters.location
          ? { address: { contains: filters.location } }
          : {}),
        ...(filters.minRating ? { rating: { gte: filters.minRating } } : {}),
        ...(filters.relationshipStatus
          ? { available_status: filters.relationshipStatus }
          : {}),
        NOT: {
          customer_interactions: {
            some: {
              customerId,
              action: "PASS",
            },
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dob: true,
        profile: true,
        latitude: true,
        longitude: true,
        status: true,
        bio: true,
        available_status: true,
        rating: true,
        Images: {
          where: { status: "active" },
          select: { id: true, name: true },
        },
        customer_interactions: {
          where: {
            customerId,
            action: { not: "PASS" },
          },
          select: { action: true },
        },
        friend_contacts: {
          where: {
            adderType: "CUSTOMER",
            customerId: customerId,
            contactType: "MODEL",
          },
          select: {
            id: true,
            modelId: true,
            contactType: true,
          },
        },
      },
    });

    // Local filtering (age, distance)
    const filteredModels = models.filter((m) => {
      let pass = true;

      if (filters.ageRange) {
        const age = differenceInYears(new Date(), new Date(m.dob));
        if (age < filters.ageRange[0] || age > filters.ageRange[1])
          pass = false;
      }

      if (
        filters.maxDistance &&
        filters.customerLat &&
        filters.customerLng &&
        m.latitude &&
        m.longitude
      ) {
        const R = 6371; // km
        const dLat = ((m.latitude - filters.customerLat) * Math.PI) / 180;
        const dLng = ((m.longitude - filters.customerLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((filters.customerLat * Math.PI) / 180) *
            Math.cos((m.latitude * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance > filters.maxDistance) pass = false;
      }

      return pass;
    });

    // Add derived fields (isContact, customerAction)
    const enhancedModels = filteredModels.map((model) => ({
      ...model,
      customerAction:
        model.customer_interactions.length > 0
          ? model.customer_interactions[0].action
          : null,
      isContact: model.friend_contacts.length > 0,
    }));

    // Pagination info
    const totalPages = Math.ceil(totalCount / perPage);

    return {
      models: enhancedModels,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        limit: perPage,
      },
    };
  } catch (error: any) {
    console.log("GET_FORYOU_MODEL_ERROR:", error);
    throw error;
  }
}

export async function getLikeMeModels(
  customerId: string,
  page: number = 1,
  limit: number = 20
) {
  try {
    const [models, totalCount] = await Promise.all([
      prisma.model.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          model_interactions: {
            some: {
              customerId: customerId.toString(),
              action: "LIKE",
            },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dob: true,
          profile: true,
          latitude: true,
          longitude: true,
          status: true,
          bio: true,
          available_status: true,
          Images: {
            where: { status: "active" },
            select: { id: true, name: true },
          },
          model_interactions: {
            where: {
              customerId: customerId.toString(),
              action: "LIKE",
            },
            select: { action: true },
          },
          customer_interactions: {
            where: {
              customerId,
              action: "LIKE",
            },
            select: { action: true },
          },
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
      }),
      prisma.model.count({
        where: {
          model_interactions: {
            some: {
              customerId: customerId.toString(),
              action: "LIKE",
            },
          },
        },
      }),
    ]);

    // Add derived field: isContact
    const enhancedModels = models.map((model) => ({
      ...model,
      isContact: model.friend_contacts.length > 0,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return {
      models: enhancedModels,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        limit,
      },
    };
  } catch (error: any) {
    console.log("GET_LIKEME_MODEL_ERROR:", error);
    throw error;
  }
}

export async function getModelsByInteraction(
  customerId: string,
  action: "LIKE" | "PASS",
  page: number = 1,
  limit: number = 20
) {
  try {
    const [models, totalCount] = await Promise.all([
      prisma.model.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          customer_interactions: {
            some: {
              customerId,
              action,
            },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dob: true,
          profile: true,
          latitude: true,
          longitude: true,
          status: true,
          bio: true,
          available_status: true,
          Images: {
            where: { status: "active" },
            select: { id: true, name: true },
          },
          customer_interactions: {
            where: {
              customerId,
              action,
            },
            select: { action: true },
          },
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
      }),
      prisma.model.count({
        where: {
          customer_interactions: {
            some: {
              customerId: customerId.toString(),
              action,
            },
          },
        },
      }),
    ]);

    // Add derived field: isContact
    const enhancedModels = models.map((model) => ({
      ...model,
      isContact: model.friend_contacts.length > 0,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return {
      models: enhancedModels,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        limit,
      },
    };
  } catch (error: any) {
    console.log("GET_MODELS_BY_INTERACTION_ERROR:", error);
    throw error;
  }
}
