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

// Discover page - Get online/active models that customer hasn't passed
export async function getModelsForCustomer(customerId: string) {
  try {
    // Get customer location for distance calculation
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { latitude: true, longitude: true },
    });

    const models = await prisma.model.findMany({
      where: {
        status: "active",
        // Exclude models the customer has passed
        customer_interactions: {
          none: {
            customerId,
            action: "PASS",
          },
        },
      },
      take: 20,
      orderBy: [
        // Prioritize models with higher ratings
        { rating: "desc" },
        // Then by most recent activity
        { updatedAt: "desc" },
      ],
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
        total_review: true,
        latitude: true,
        longitude: true,
        available_status: true,
        createdAt: true,
        updatedAt: true,
        Images: {
          where: { status: "active" },
          take: 5,
          select: { id: true, name: true },
          orderBy: { createdAt: "desc" },
        },
        customer_interactions: {
          where: { customerId },
          select: { action: true, createdAt: true },
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
        // Count total likes received
        _count: {
          select: {
            customer_interactions: {
              where: { action: "LIKE" },
            },
            model_interactions: {
              where: { action: "LIKE" },
            },
          },
        },
      },
    });

    // Calculate distance and enhance models
    return models.map((model) => {
      let distance = null;
      if (
        customer?.latitude &&
        customer?.longitude &&
        model.latitude &&
        model.longitude
      ) {
        distance = calculateDistance(
          customer.latitude,
          customer.longitude,
          model.latitude,
          model.longitude
        );
      }

      return {
        ...model,
        distance: distance ? Number(distance.toFixed(2)) : null,
        customerAction:
          model.customer_interactions.length > 0
            ? model.customer_interactions[0].action
            : null,
        isContact: model.friend_contacts.length > 0,
        totalLikes: model._count.customer_interactions,
        popularity:
          model._count.customer_interactions + model._count.model_interactions,
      };
    });
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

// Get nearby models based on geolocation distance
export async function getNearbyModels(
  customerId: string,
  maxDistanceKm: number = 50
) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      latitude: true,
      longitude: true,
      gender: true, // Use for opposite gender matching
    },
  });

  if (!customer?.latitude || !customer?.longitude)
    throw new Error("Customer location missing");

  const models = await prisma.model.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      status: "active",
      // Exclude models the customer has passed
      customer_interactions: {
        none: {
          customerId,
          action: "PASS",
        },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dob: true,
      gender: true,
      bio: true,
      profile: true,
      latitude: true,
      longitude: true,
      address: true,
      status: true,
      rating: true,
      total_review: true,
      available_status: true,
      updatedAt: true,
      Images: {
        take: 3,
        where: { status: "active" },
        select: { id: true, name: true },
        orderBy: { createdAt: "desc" },
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
      _count: {
        select: {
          customer_interactions: {
            where: { action: "LIKE" },
          },
        },
      },
    },
  });

  // Calculate distance and filter by maxDistance
  const modelsWithDistance = models
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
        customerAction:
          m.customer_interactions.length > 0
            ? m.customer_interactions[0].action
            : null,
        totalLikes: m._count.customer_interactions,
      };
    })
    .filter((m) => m.distance <= maxDistanceKm) // Filter by max distance
    .sort((a, b) => {
      // Sort by distance first, then by rating
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      return b.rating - a.rating;
    })
    .slice(0, 20); // Return top 20 nearest

  return modelsWithDistance;
}

// Get hot/trending models based on popularity and recent activity
export async function getHotModels(customerId: string, limit: number = 10) {
  try {
    // Get customer info for personalized results
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { latitude: true, longitude: true, gender: true },
    });

    // Calculate "hot" models based on multiple factors:
    // 1. Total likes received (both from customers and models)
    // 2. High rating
    // 3. Recent activity (updatedAt)
    // 4. Number of reviews
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(
      currentDate.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    const hotModels = await prisma.model.findMany({
      where: {
        status: "active",
        // Exclude models the customer has passed
        customer_interactions: {
          none: {
            customerId,
            action: "PASS",
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dob: true,
        gender: true,
        bio: true,
        profile: true,
        rating: true,
        total_review: true,
        latitude: true,
        longitude: true,
        address: true,
        available_status: true,
        updatedAt: true,
        createdAt: true,
        Images: {
          take: 3,
          where: {
            status: "active",
          },
          select: {
            id: true,
            name: true,
          },
          orderBy: { createdAt: "desc" },
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
        _count: {
          select: {
            // Count all likes from customers
            customer_interactions: {
              where: { action: "LIKE" },
            },
            // Count all likes from other models
            model_interactions: {
              where: { action: "LIKE" },
            },
            // Count recent interactions (last 30 days)
            service_booking: {
              where: {
                createdAt: { gte: thirtyDaysAgo },
                status: { in: ["confirmed", "completed"] },
              },
            },
          },
        },
      },
    });

    // Calculate popularity score for each model
    const modelsWithScore = hotModels.map((model) => {
      const customerLikes = model._count.customer_interactions;
      const modelLikes = model._count.model_interactions;
      const recentBookings = model._count.service_booking;
      const reviewScore = model.total_review * 0.5;
      const ratingScore = model.rating * 10;

      // Calculate days since last activity
      const daysSinceUpdate = Math.floor(
        (currentDate.getTime() - new Date(model.updatedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const recencyScore = Math.max(0, 30 - daysSinceUpdate); // Higher score for recent activity

      // Calculate distance if location available
      let distance = null;
      let distanceScore = 0;
      if (
        customer?.latitude &&
        customer?.longitude &&
        model.latitude &&
        model.longitude
      ) {
        distance = calculateDistance(
          customer.latitude,
          customer.longitude,
          model.latitude,
          model.longitude
        );
        // Closer models get higher score (max 20 points for models within 10km)
        distanceScore = Math.max(0, 20 - distance / 5);
      }

      // Popularity formula (weighted scoring):
      // - Customer likes: 3 points each
      // - Model likes: 2 points each
      // - Recent bookings: 5 points each
      // - Rating: rating * 10 (max 50 points)
      // - Reviews: total_review * 0.5
      // - Recency: max 30 points
      // - Distance: max 20 points
      const popularityScore =
        customerLikes * 3 +
        modelLikes * 2 +
        recentBookings * 5 +
        ratingScore +
        reviewScore +
        recencyScore +
        distanceScore;

      return {
        ...model,
        distance: distance ? Number(distance.toFixed(2)) : null,
        customerAction:
          model.customer_interactions.length > 0
            ? model.customer_interactions[0].action
            : null,
        isContact: model.friend_contacts.length > 0,
        likeCount: customerLikes,
        totalLikes: customerLikes + modelLikes,
        recentBookings: recentBookings,
        popularityScore: Number(popularityScore.toFixed(2)),
      };
    });

    // Sort by popularity score and return top results
    const sortedModels = modelsWithScore
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit);

    return sortedModels;
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

    // Get customer location for distance filtering
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { latitude: true, longitude: true },
    });

    // Fetch ALL models (without pagination first, for distance filtering)
    const allModels = await prisma.model.findMany({
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
    const filteredModels = allModels.filter((m) => {
      let pass = true;

      // Age filter
      if (filters.ageRange) {
        const age = differenceInYears(new Date(), new Date(m.dob));
        if (age < filters.ageRange[0] || age > filters.ageRange[1])
          pass = false;
      }

      // Distance filter - use customer's GPS coordinates from database
      if (
        filters.maxDistance &&
        customer?.latitude &&
        customer?.longitude &&
        m.latitude &&
        m.longitude
      ) {
        const distance = calculateDistance(
          customer.latitude,
          customer.longitude,
          m.latitude,
          m.longitude
        );

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

    // Apply pagination AFTER filtering
    const totalCount = enhancedModels.length;
    const paginatedModels = enhancedModels.slice(skip, skip + perPage);

    // Pagination info
    const totalPages = Math.ceil(totalCount / perPage);

    return {
      models: paginatedModels,
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
