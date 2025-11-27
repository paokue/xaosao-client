import React, { useState, useEffect } from "react";
import { modelRegister } from "~/services/model-auth.server";
import { Eye, EyeOff, Camera, X, Loader2 } from "lucide-react";
import { uploadFileToBunnyServer } from "~/services/upload.server";
import type { ActionFunctionArgs, MetaFunction } from "react-router";
import type { IModelSignupCredentials } from "~/services/model-auth.server";
import { Form, Link, useActionData, useNavigation, useNavigate } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Companion Registration - XaoSao" },
    { name: "description", content: "Register as a companion" },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const username = formData.get("username");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const dob = formData.get("dob");
  const gender = formData.get("gender");
  const whatsapp = formData.get("whatsapp");
  const bio = formData.get("bio");
  const address = formData.get("address");
  const career = formData.get("career");
  const education = formData.get("education");
  const interestsJson = formData.get("interests");
  const newProfile = formData.get("newProfile") as File | null;

  // Validation
  if (!firstName || !username || !password || !dob || !gender || !whatsapp || !bio || !address) {
    return {
      error: "Please fill in all required fields (First Name, Username, Password, DOB, Gender, WhatsApp, Bio, Address, and Profile Image)",
    };
  }

  if (!newProfile || !(newProfile instanceof File) || newProfile.size === 0) {
    return {
      error: "Profile image is required",
    };
  }

  if (password !== confirmPassword) {
    return {
      error: "Passwords do not match",
    };
  }

  if (String(password).length < 8) {
    return {
      error: "Password must be at least 8 characters",
    };
  }

  try {
    // Upload profile image to Bunny CDN
    const buffer = Buffer.from(await newProfile.arrayBuffer());
    const profileUrl = await uploadFileToBunnyServer(buffer, newProfile.name, newProfile.type);

    // Get client IP
    const ip = request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const accessKey = process.env.APIIP_API_KEY || "";

    // Parse interests
    let interests: string[] | undefined;
    if (interestsJson) {
      try {
        interests = JSON.parse(String(interestsJson));
      } catch {
        interests = undefined;
      }
    }

    const modelData: IModelSignupCredentials = {
      firstName: String(firstName),
      lastName: lastName ? String(lastName) : undefined,
      username: String(username),
      password: String(password),
      dob: String(dob),
      gender: String(gender) as "male" | "female" | "other",
      whatsapp: Number(whatsapp),
      bio: String(bio),
      profile: profileUrl,
      address: String(address),
      career: career ? String(career) : undefined,
      education: education ? String(education) : undefined,
      interests,
    };

    const result = await modelRegister(modelData, ip.split(",")[0], accessKey);

    if (result.success) {
      return {
        success: true,
        message: result.message,
      };
    }

    return { error: result.message };
  } catch (error: any) {
    return {
      error: error.message || "Registration failed. Please try again.",
    };
  }
}

export default function ModelRegister() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [image, setImage] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actionData?.success) {
      const timer = setTimeout(() => {
        navigate("/model-auth/login");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [actionData, navigate]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeInterest = (index: number) => {
    setInterests(interests.filter((_, i) => i !== index));
  };

  const addInterest = () => {
    if (newInterest.trim()) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-purple-50 px-4 py-2">
      <div className="max-w-2xl w-full space-y-8 bg-white px-2 sm:px-8 py-4 rounded-lg shadow-xl">
        <Form method="post" encType="multipart/form-data" className="mt-8 space-y-6">
          {actionData?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {actionData.error}
            </div>
          )}

          <div className="flex flex-col items-center justify-center space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Please choose your profile image <span className="text-rose-500">*</span>
            </label>
            <div className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center">
              <img
                src={image || "/images/default-image.png"}
                alt="Profile Preview"
                className="w-full h-full rounded-full object-cover shadow-md border-2 border-rose-200"
              />
              <label className="absolute bottom-1 right-1 bg-rose-500 p-2 rounded-full cursor-pointer shadow-md hover:bg-rose-600">
                <Camera className="w-5 h-5 text-white" />
                <input
                  type="file"
                  name="newProfile"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={onFileChange}
                  required
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                placeholder="Enter your first name...."
                className="text-sm appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Enter your last name...."
                className="text-sm appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-rose-500">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="Enter your username...."
                className="text-sm appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                required
                maxLength={10}
                placeholder="2012345678"
                className="text-sm appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <input
                id="dob"
                name="dob"
                type="date"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                id="gender"
                name="gender"
                required
                className="text-sm appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-rose-500">*</span> (Minimum 8 characters)
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="Enter your password...."
                  className="text-sm appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <Eye className="h-4 w-4 cursor-pointer" /> : <EyeOff className="h-4 w-4 cursor-pointer" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="Confirm your password...."
                  className="text-sm appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? <Eye className="h-4 w-4 cursor-pointer" /> : <EyeOff className="h-4 w-4 cursor-pointer" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                placeholder="Enter your address...."
                className="text-sm appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={2}
                required
                placeholder="Tell us about yourself..."
                className="text-sm appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label htmlFor="career" className="block text-sm font-medium text-gray-700 mb-1">
                Career
              </label>
              <input
                id="career"
                name="career"
                type="text"
                placeholder="Enter your career...."
                className="text-sm appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-1">
                Education
              </label>
              <input
                id="education"
                name="education"
                type="text"
                placeholder="Enter your education...."
                className="text-sm appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Interests
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {interests.map((interest, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-1.5 rounded-md text-sm
                    bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-500
                    hover:text-rose-600 transition-colors cursor-pointer space-x-2"
                  >
                    <span>{interest}</span>
                    <X
                      size={16}
                      className="cursor-pointer"
                      onClick={() => removeInterest(index)}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add an interest (e.g., Music, Sports)..."
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addInterest();
                    }
                  }}
                  className="text-sm flex-1 appearance-none px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={addInterest}
                  className="px-4 py-2 bg-rose-100 border border-rose-200 text-rose-500 hover:bg-rose-200 rounded-lg text-sm font-medium"
                >
                  Add
                </button>
              </div>
              <input type="hidden" name="interests" value={JSON.stringify(interests)} />
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? "Creating Account..." : "Register"}
              </button>
            </div>
          </div>



          <div className="text-center text-sm">
            <p className="text-gray-600">
              Already have an account?&nbsp;&nbsp;
              <Link to="/model-auth/login" className="font-medium text-rose-600 hover:text-rose-500 text-xs uppercase">
                Sign in
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </div>
  );
}
