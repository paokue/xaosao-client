export interface ValidationErrorPayload {
  success: boolean;
  error: boolean;
  message: string;
  [key: string]: any; // allow extra fields like `fieldName`, etc.
}

export class FieldValidationError extends Error {
  constructor(public readonly payload: ValidationErrorPayload) {
    super(payload.message || "Validation error");
    this.name = "FieldValidationError";
  }
}

export async function getLocationDetails(
  ip: string,
  accessKey: string
): Promise<any> {
  const url = `https://apiip.net/api/check?ip=${ip}&accessKey=${accessKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`API Error: ${data.error}`);
    }

    return data;
  } catch (error) {
    console.error("ERROR_FETCH_LOCATION_DETAILS:", error);
    throw error;
  }
}

export async function getCurrentIP() {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Error fetching IP:", error);
    throw new Error("Failed to get IP address");
  }
}
