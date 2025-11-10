"use client";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MedicalLoader } from "@/components/ui/medical-loader";
import { useRole } from "@/lib/useRole";
import { ROLES } from "@/lib/roles";
import { useClerk } from "@clerk/nextjs";
import { getApiUrl } from "@/lib/api-config";

interface MedicalSupply {
  name: string;
  quantity: number;
}

function CreateRecordForm() {
  const [diseaseName, setDiseaseName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [medicalSupplies, setMedicalSupplies] = useState<MedicalSupply[]>([]);
  const [supplyInput, setSupplyInput] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const createRecord = useMutation(api.reports.createDiseaseRecord);
  const userRole = useRole();
  const convexRoleCheck = useQuery(api.reports.checkUserRole);
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleSetRole = async () => {
    if (!user?.id) {
      setSaveStatus({
        type: "error",
        message: "User not authenticated",
      });
      return;
    }
    try {
      const response = await fetch(getApiUrl("/api/set-role"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "asha", invite: "ASHA2025", userId: user.id }),
      });
      const data = await response.json();
      if (data.ok) {
        setSaveStatus({
          type: "success",
          message:
            "Role set successfully! IMPORTANT: Please sign out and sign back in to refresh your session token, then try creating a record again.",
        });
      } else {
        setSaveStatus({
          type: "error",
          message: data.error || "Failed to set role",
        });
      }
    } catch (error) {
      setSaveStatus({
        type: "error",
        message:
          "Failed to set role. Please try visiting /after-signin?role=asha&invite=ASHA2025",
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSupply = () => {
    if (supplyInput.trim() && quantityInput.trim()) {
      const quantity = parseInt(quantityInput);
      if (isNaN(quantity) || quantity <= 0) {
        setSaveStatus({
          type: "error",
          message: "Please enter a valid quantity (greater than 0)",
        });
        return;
      }
      setMedicalSupplies([
        ...medicalSupplies,
        { name: supplyInput.trim(), quantity },
      ]);
      setSupplyInput("");
      setQuantityInput("");
      setSaveStatus(null);
    } else {
      setSaveStatus({
        type: "error",
        message: "Please enter both supply name and quantity",
      });
    }
  };

  const handleRemoveSupply = (index: number) => {
    setMedicalSupplies(medicalSupplies.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);

    try {
      // First, verify role server-side to work around JWT token caching
      let serverVerifiedRole: string | undefined;
      if (user?.id) {
        try {
          const verifyResponse = await fetch(getApiUrl(`/api/verify-role?userId=${user.id}`));
          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            if (verifyData.hasPermission) {
              serverVerifiedRole = verifyData.role;
              console.log("Server verified role:", serverVerifiedRole);
            } else {
              console.warn("Server verification failed - role:", verifyData.role);
            }
          }
        } catch (verifyError) {
          console.warn("Could not verify role server-side:", verifyError);
          // Continue anyway, will rely on JWT token
        }
      }

      await createRecord({
        diseaseName,
        description,
        location: location.trim() || undefined,
        imageUrl: imagePreview || undefined,
        medicalSupplies,
        serverVerifiedRole, // Pass server-verified role as workaround
      });

      // Reset form
      setDiseaseName("");
      setDescription("");
      setLocation("");
      setImageFile(null);
      setImagePreview(null);
      setMedicalSupplies([]);
      setSupplyInput("");
      setQuantityInput("");
      setSaveStatus({
        type: "success",
        message:
          "Record saved successfully! Check the Saved/Edit tab to view it.",
      });
      // Clear success message after 5 seconds
      setTimeout(() => setSaveStatus(null), 5000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save record";
      setSaveStatus({
        type: "error",
        message: errorMessage,
      });
      console.error("Error creating record:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Check if user has the correct role
  const hasPermission = userRole === ROLES.ASHA || userRole === ROLES.ADMIN;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Create New Disease Record</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs"
        >
          {showDebug ? "Hide" : "Show"} Debug Info
        </Button>
      </div>

      {showDebug && convexRoleCheck && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-xs">
          <p className="font-semibold mb-2">🔍 Debug Information:</p>
          <div className="space-y-1">
            <p>
              <strong>Client-side role (from Clerk):</strong> {userRole}
            </p>
            <p>
              <strong>Convex sees role:</strong>{" "}
              {convexRoleCheck.role || "Unknown"}
            </p>
            <p>
              <strong>Convex has permission:</strong>{" "}
              {convexRoleCheck.hasPermission ? "✅ Yes" : "❌ No"}
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">
                View Full Metadata
              </summary>
              <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(convexRoleCheck, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      {!hasPermission && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800 font-medium mb-2">
            ⚠️ Role Permission Issue
          </p>
          <p className="text-sm text-yellow-700 mb-2">
            Your current role is: <strong>"{userRole}"</strong>
          </p>
          <p className="text-sm text-yellow-700 mb-3">
            To create disease records, you need to have the{" "}
            <strong>ASHA</strong> or <strong>Admin</strong> role set in your
            Clerk account.
          </p>
          <div className="text-sm text-yellow-700 space-y-2">
            <p className="font-medium">To set your role:</p>
            <Button
              type="button"
              onClick={handleSetRole}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Set ASHA Role (Auto)
            </Button>
            <div className="mt-2 p-2 bg-yellow-100 rounded text-xs space-y-2">
              <p className="font-semibold mb-1">⚠️ Important:</p>
              <p>
                After setting your role, you{" "}
                <strong>must sign out and sign back in</strong> for the changes
                to take effect. The authentication token needs to be refreshed.
              </p>
              <Button
                type="button"
                onClick={() => {
                  signOut({ redirectUrl: window.location.origin + "/asha" });
                }}
                variant="outline"
                size="sm"
                className="w-full mt-2"
              >
                Sign Out to Refresh Session
              </Button>
            </div>
            <p className="text-xs text-yellow-600 mt-2">Or manually visit:</p>
            <code className="block bg-yellow-100 px-2 py-1 rounded text-xs break-all">
              /after-signin?role=asha&invite=ASHA2025
            </code>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Disease Name */}
        <div className="space-y-2">
          <Label
            htmlFor="diseaseName"
            className="text-sm font-semibold text-gray-700"
          >
            Disease Name *
          </Label>
          <Input
            id="diseaseName"
            type="text"
            value={diseaseName}
            onChange={(e) => setDiseaseName(e.target.value)}
            required
            placeholder="Enter disease name"
            className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label
            htmlFor="image"
            className="text-sm font-semibold text-gray-700"
          >
            Disease Image
          </Label>
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="cursor-pointer"
          />
          {imagePreview && (
            <div className="mt-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-w-md h-48 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="mt-2"
              >
                Remove Image
              </Button>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="text-sm font-semibold text-gray-700"
          >
            Description *
          </Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Enter description about the disease"
            rows={4}
            className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blue-500/50 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label
            htmlFor="location"
            className="text-sm font-semibold text-gray-700"
          >
            Patient Location
          </Label>
          <Input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location (e.g., Village, Street, Area)"
            className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Medical Supplies */}
        <div className="space-y-2">
          <Label
            htmlFor="supplies"
            className="text-sm font-semibold text-gray-700"
          >
            Medical Supplies Needed
          </Label>
          <div className="flex gap-2">
            <Input
              id="supplies"
              type="text"
              value={supplyInput}
              onChange={(e) => setSupplyInput(e.target.value)}
              placeholder="Enter medical supply name"
              className="flex-1 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSupply();
                }
              }}
            />
            <Input
              type="number"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              placeholder="Qty"
              className="w-24 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              min="1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSupply();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddSupply}
              className="h-11 border-gray-300 hover:bg-blue-50 hover:border-blue-500"
            >
              Add
            </Button>
          </div>
          {medicalSupplies.length > 0 && (
            <div className="mt-3 space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Added Supplies:
              </Label>
              <ul className="space-y-2">
                {medicalSupplies.map((supply, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200 shadow-sm"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {supply.name} - Quantity: {supply.quantity}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSupply(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Save Status */}
        {saveStatus && (
          <div
            className={`p-3 rounded-md ${
              saveStatus.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {saveStatus.message}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={isSaving || !hasPermission}
            className="w-36 h-10 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 
               hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 
               hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 
               disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg rounded-md"
          >
            {isSaving ? "Saving..." : "Save Record ✅"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function SavedEditRecords() {
  const userRole = useRole();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [serverVerifiedRole, setServerVerifiedRole] = useState<
    string | undefined
  >(undefined);
  const [isVerifying, setIsVerifying] = useState(true);

  // Verify role server-side first
  useEffect(() => {
    if (!user?.id) {
      setIsVerifying(false);
      return;
    }
    fetch(getApiUrl(`/api/verify-role?userId=${user.id}`))
      .then((res) => res.json())
      .then((data) => {
        if (data.hasPermission) {
          setServerVerifiedRole(data.role);
          console.log("Server verified role for query:", data.role);
        }
        setIsVerifying(false);
      })
      .catch((err) => {
        console.warn("Could not verify role:", err);
        setIsVerifying(false);
      });
  }, [user?.id]);

  // Pass server-verified role to query (skip query until we verify role)
  const records = useQuery(
    api.reports.getDiseaseRecords,
    isVerifying ? "skip" : serverVerifiedRole ? { serverVerifiedRole } : {}
  );

  const updateRecord = useMutation(api.reports.updateDiseaseRecord);
  const registerRecord = useMutation(api.reports.registerDiseaseRecord);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    diseaseName: string;
    description: string;
    location: string | null;
    imageUrl: string | null;
    medicalSupplies: MedicalSupply[];
  } | null>(null);
  const [supplyInput, setSupplyInput] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegistering, setIsRegistering] = useState<string | null>(null);

  const handleEdit = (record: any) => {
    setEditingId(record._id);
    setEditForm({
      diseaseName: record.diseaseName,
      description: record.description,
      location: record.location || null,
      imageUrl: record.imageUrl || null,
      medicalSupplies: record.medicalSupplies || [],
    });
    setImagePreview(record.imageUrl || null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setImagePreview(null);
    setSupplyInput("");
    setQuantityInput("");
  };

  const handleAddSupply = () => {
    if (!editForm) return;
    if (supplyInput.trim() && quantityInput.trim()) {
      const quantity = parseInt(quantityInput);
      if (isNaN(quantity) || quantity <= 0) {
        return;
      }
      setEditForm({
        ...editForm,
        medicalSupplies: [
          ...editForm.medicalSupplies,
          { name: supplyInput.trim(), quantity },
        ],
      });
      setSupplyInput("");
      setQuantityInput("");
    }
  };

  const handleRemoveSupply = (index: number) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      medicalSupplies: editForm.medicalSupplies.filter((_, i) => i !== index),
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editForm) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setEditForm({ ...editForm, imageUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm) return;
    setIsSaving(true);
    try {
      // Verify role server-side first
      let verifiedRole: string | undefined = serverVerifiedRole;
      if (!verifiedRole && user?.id) {
        try {
          const verifyResponse = await fetch(getApiUrl(`/api/verify-role?userId=${user.id}`));
          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            if (verifyData.hasPermission) {
              verifiedRole = verifyData.role;
            }
          }
        } catch (verifyError) {
          console.warn("Could not verify role:", verifyError);
        }
      }

      await updateRecord({
        id: editingId as any,
        diseaseName: editForm.diseaseName,
        description: editForm.description,
        location: editForm.location?.trim() || undefined,
        imageUrl: editForm.imageUrl || undefined,
        medicalSupplies: editForm.medicalSupplies,
        serverVerifiedRole: verifiedRole,
      });
      handleCancelEdit();
      // Success - the record will automatically refresh via Convex query
    } catch (error) {
      console.error("Failed to update record:", error);
      alert(error instanceof Error ? error.message : "Failed to update record");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegister = async (id: string) => {
    setIsRegistering(id);
    try {
      // Verify role server-side first
      let verifiedRole: string | undefined = serverVerifiedRole;
      if (!verifiedRole && user?.id) {
        try {
          const verifyResponse = await fetch(getApiUrl(`/api/verify-role?userId=${user.id}`));
          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            if (verifyData.hasPermission) {
              verifiedRole = verifyData.role;
            }
          }
        } catch (verifyError) {
          console.warn("Could not verify role:", verifyError);
        }
      }

      await registerRecord({
        id: id as any,
        serverVerifiedRole: verifiedRole,
      });
      // Success - the record will be removed from draft list and appear in registered tab
      // Convex automatically refreshes queries after mutations
    } catch (error) {
      console.error("Failed to register record:", error);
      alert(
        error instanceof Error ? error.message : "Failed to register record"
      );
      setIsRegistering(null);
    } finally {
      setIsRegistering(null);
    }
  };

  // Handle loading state
  if (records === undefined) {
    return <MedicalLoader message="Loading your records..." size="md" />;
  }

  // Handle error state (when query fails due to permission)
  // Note: Convex queries throw errors that React Query catches
  // We need to check if records is an error or handle it differently
  // For now, if we get here and records is not an array, show error message
  if (!Array.isArray(records)) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Saved/Edit Records</h3>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800 font-medium mb-2">
            ⚠️ Session Token Issue
          </p>
          <p className="text-sm text-yellow-700 mb-2">
            Your current role is: <strong>"{userRole}"</strong>
          </p>
          <p className="text-sm text-yellow-700 mb-3">
            It appears your session token hasn't been updated with your new
            role. Please sign out and sign back in to refresh your session.
          </p>
          <Button
            onClick={() => {
              signOut({ redirectUrl: window.location.origin + "/asha" });
            }}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Sign Out to Refresh Session
          </Button>
        </div>
      </div>
    );
  }

  const draftRecords = records.filter((r) => r.status === "draft");

  if (draftRecords.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Saved/Edit Records</h3>
        <p className="text-muted-foreground">
          No saved records found. Create a new record in the Create tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Saved/Edit Records</h3>
      <p className="text-muted-foreground">
        View, edit, or register your saved disease records.
      </p>

      <div className="space-y-4">
        {draftRecords.map((record) => (
          <Card key={record._id}>
            {editingId === record._id ? (
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Disease Name *</Label>
                    <Input
                      value={editForm?.diseaseName || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm!,
                          diseaseName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full max-w-md h-48 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <textarea
                      value={editForm?.description || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm!,
                          description: e.target.value,
                        })
                      }
                      required
                      rows={4}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={editForm?.location || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm!, location: e.target.value })
                      }
                      placeholder="Enter location (e.g., Village, Street, Area)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Medical Supplies</Label>
                    <div className="flex gap-2">
                      <Input
                        value={supplyInput}
                        onChange={(e) => setSupplyInput(e.target.value)}
                        placeholder="Supply name"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={quantityInput}
                        onChange={(e) => setQuantityInput(e.target.value)}
                        placeholder="Qty"
                        className="w-24"
                        min="1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddSupply}
                      >
                        Add
                      </Button>
                    </div>
                    {editForm?.medicalSupplies.map((supply, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                      >
                        <span className="text-sm">
                          {supply.name} - Quantity: {supply.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSupply(index)}
                          className="text-red-600"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            ) : (
              <>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{record.diseaseName}</CardTitle>
                      <CardDescription>
                        Created:{" "}
                        {new Date(record.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(record)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRegister(record._id)}
                        disabled={isRegistering === record._id}
                        variant="default"
                      >
                        {isRegistering === record._id
                          ? "Publishing..."
                          : "Publish"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {record.imageUrl && (
                    <img
                      src={record.imageUrl}
                      alt={record.diseaseName}
                      className="w-full max-w-md h-48 object-cover rounded-lg border mb-4"
                    />
                  )}
                  {record.location && (
                    <div className="mb-3">
                      <span className="text-sm font-medium">Location: </span>
                      <span className="text-sm text-muted-foreground">
                        {record.location}
                      </span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mb-4">
                    {record.description}
                  </p>
                  {record.medicalSupplies &&
                    record.medicalSupplies.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">
                          Medical Supplies Needed:
                        </h4>
                        <ul className="space-y-1">
                          {record.medicalSupplies.map(
                            (supply: MedicalSupply, index: number) => (
                              <li key={index} className="text-sm">
                                • {supply.name} - Quantity: {supply.quantity}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function RegisteredRecords() {
  const userRole = useRole();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [serverVerifiedRole, setServerVerifiedRole] = useState<
    string | undefined
  >(undefined);
  const [isVerifying, setIsVerifying] = useState(true);

  // Verify role server-side first
  useEffect(() => {
    if (!user?.id) {
      setIsVerifying(false);
      return;
    }
    fetch(getApiUrl(`/api/verify-role?userId=${user.id}`))
      .then((res) => res.json())
      .then((data) => {
        if (data.hasPermission) {
          setServerVerifiedRole(data.role);
          console.log(
            "Server verified role for registered records query:",
            data.role
          );
        }
        setIsVerifying(false);
      })
      .catch((err) => {
        console.warn("Could not verify role:", err);
        setIsVerifying(false);
      });
  }, [user?.id]);

  // Pass server-verified role to query (skip query until we verify role)
  const records = useQuery(
    api.reports.getRegisteredRecords,
    isVerifying ? "skip" : serverVerifiedRole ? { serverVerifiedRole } : {}
  );

  if (records === undefined) {
    return <MedicalLoader message="Loading registered records..." size="md" />;
  }

  // Handle error state - if query failed due to permission, records won't be an array
  if (!Array.isArray(records)) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Registered Records</h3>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800 font-medium mb-2">
            ⚠️ Session Token Issue
          </p>
          <p className="text-sm text-yellow-700 mb-2">
            Your current role is: <strong>"{userRole}"</strong>
          </p>
          <p className="text-sm text-yellow-700 mb-3">
            Please sign out and sign back in to refresh your session token.
          </p>
          <Button
            onClick={() => {
              signOut({ redirectUrl: window.location.origin + "/asha" });
            }}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Sign Out to Refresh Session
          </Button>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Registered Records</h3>
        <p className="text-muted-foreground">No registered records found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Registered Records</h3>
      <p className="text-muted-foreground">
        View all registered disease records.
      </p>

      <div className="space-y-4">
        {records.map((record) => (
          <Card key={record._id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{record.diseaseName}</CardTitle>
                  <CardDescription>
                    Registered:{" "}
                    {new Date(
                      record.updatedAt || record.createdAt
                    ).toLocaleDateString()}
                  </CardDescription>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md">
                  Registered
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {record.imageUrl && (
                <img
                  src={record.imageUrl}
                  alt={record.diseaseName}
                  className="w-full max-w-md h-48 object-cover rounded-lg border mb-4"
                />
              )}
              {record.location && (
                <div className="mb-3">
                  <span className="text-sm font-medium">Location: </span>
                  <span className="text-sm text-muted-foreground">
                    {record.location}
                  </span>
                </div>
              )}
              <p className="text-sm text-muted-foreground mb-4">
                {record.description}
              </p>
              {record.medicalSupplies && record.medicalSupplies.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Medical Supplies Needed:</h4>
                  <ul className="space-y-1">
                    {record.medicalSupplies.map(
                      (supply: MedicalSupply, index: number) => (
                        <li key={index} className="text-sm">
                          • {supply.name} - Quantity: {supply.quantity}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AdminInterface() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [serverVerifiedRole, setServerVerifiedRole] = useState<
    string | undefined
  >(undefined);
  const [isVerifying, setIsVerifying] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  // Verify role server-side first
  useEffect(() => {
    if (!user?.id) {
      setIsVerifying(false);
      return;
    }
    fetch(getApiUrl(`/api/verify-role?userId=${user.id}`))
      .then((res) => res.json())
      .then((data) => {
        if (data.hasPermission) {
          setServerVerifiedRole(data.role);
        }
        setIsVerifying(false);
      })
      .catch((err) => {
        console.warn("Could not verify role:", err);
        setIsVerifying(false);
      });
  }, [user?.id]);

  // Fetch all registered records
  const records = useQuery(
    api.reports.getRegisteredRecords,
    isVerifying ? "skip" : serverVerifiedRole ? { serverVerifiedRole } : {}
  );

  // Extract unique locations from records
  const locations = React.useMemo(() => {
    if (!Array.isArray(records)) return [];
    const locationSet = new Set<string>();
    records.forEach((record) => {
      if (record.location && record.location.trim()) {
        locationSet.add(record.location.trim());
      }
    });
    return Array.from(locationSet).sort();
  }, [records]);

  // Filter records by selected location
  const filteredRecords = React.useMemo(() => {
    if (!Array.isArray(records)) return [];
    if (!selectedLocation) return [];
    return records.filter(
      (record) => record.location && record.location.trim() === selectedLocation
    );
  }, [records, selectedLocation]);

  if (records === undefined) {
    return <MedicalLoader message="Loading admin data..." size="md" />;
  }

  if (!Array.isArray(records)) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800 font-medium">
          ⚠️ Unable to load records. Please check your permissions.
        </p>
      </div>
    );
  }

  const userName =
    user?.fullName ||
    (user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.primaryEmailAddress?.emailAddress || "Admin");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg">
        <div className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold flex items-center gap-3">
                  <span>Doctor Control Panel 🩺</span>
                </h1>
                <p className="text-blue-100 text-lg mt-2">
                  Welcome Admin, <span className="text-white font-semibold">{userName}</span>
                </p>
                <p className="text-blue-200 text-sm mt-1">
                  View and manage ASHA portal registered records by location
                </p>
              </div>
              <Button
                onClick={() => signOut({ redirectUrl: window.location.origin })}
                className="text-white font-semibold rounded-full px-5 py-2
                   bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500
                   hover:from-red-600 hover:via-red-500 hover:to-red-400
                   shadow-md hover:shadow-lg hover:shadow-red-500/40
                   transition-all duration-300 active:scale-95"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 p-6 lg:p-8">
          {/* Location Selector */}
          <div className="mb-6">
            <Label
              htmlFor="location-select"
              className="text-lg font-semibold text-gray-700 mb-3 block"
            >
              Select Location
            </Label>
            <Select
              value={selectedLocation}
              onValueChange={setSelectedLocation}
            >
              <SelectTrigger className="w-full md:w-96 h-12 text-base">
                <SelectValue placeholder="Choose a location to view records" />
              </SelectTrigger>
              <SelectContent>
                {locations.length === 0 ? (
                  <SelectItem value="no-locations" disabled>
                    No locations available
                  </SelectItem>
                ) : (
                  locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {locations.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                {locations.length} location{locations.length !== 1 ? "s" : ""}{" "}
                available
              </p>
            )}
          </div>

          {/* Records Display */}
          {!selectedLocation ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Please select a location to view disease records
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No records found for location: <strong>{selectedLocation}</strong>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Records for: <span className="text-blue-600">{selectedLocation}</span>
                </h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""}
                </span>
              </div>

              {filteredRecords.map((record) => (
                <Card
                  key={record._id}
                  className="bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl text-gray-800">
                          {record.diseaseName}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          Registered:{" "}
                          {new Date(
                            record.updatedAt || record.createdAt
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </CardDescription>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md">
                        Registered
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Description */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        Description:
                      </h3>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200">
                        {record.description}
                      </p>
                    </div>

                    {/* Medical Supplies */}
                    {record.medicalSupplies &&
                      record.medicalSupplies.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">
                            Medical Supplies Needed:
                          </h3>
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-md border border-blue-200">
                            <ul className="space-y-2">
                              {record.medicalSupplies.map(
                                (supply: MedicalSupply, index: number) => (
                                  <li
                                    key={index}
                                    className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm"
                                  >
                                    <span className="text-sm font-medium text-gray-700">
                                      {supply.name}
                                    </span>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                      Quantity: {supply.quantity}
                                    </span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      )}

                    {/* Image if available */}
                    {record.imageUrl && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">
                          Disease Image:
                        </h3>
                        <img
                          src={record.imageUrl}
                          alt={record.diseaseName}
                          className="w-full max-w-md h-64 object-cover rounded-lg border-2 border-gray-300 shadow-md"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Dashboard({ mode }: { mode: "admin" | "asha" | "citizen" }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  // Move hooks to top level - always call hooks in the same order
  // Use "skip" to conditionally skip queries when not needed
  const data = useQuery(
    api.reports.getVillageSummary,
    mode !== "asha" && isLoaded && user ? { village: "Bangalore" } : "skip"
  );
  const allRecords = useQuery(
    api.reports.getDiseaseRecords,
    mode === "asha" && isLoaded && user
      ? { serverVerifiedRole: "asha" }
      : "skip"
  );
  const registeredRecords = useQuery(
    api.reports.getRegisteredRecords,
    mode === "asha" && isLoaded && user
      ? { serverVerifiedRole: "asha" }
      : "skip"
  );

  // Show loader while user is loading or data is loading (only for citizen/admin modes)
  if (!isLoaded || (mode !== "asha" && data === undefined)) {
    return (
      <MedicalLoader
        message="Loading health data..."
        size="lg"
        className="min-h-[400px]"
      />
    );
  }

  // Citizen view
  if (mode === "citizen") {
    if (!data || data.type !== "summary") {
      return (
        <MedicalLoader
          message="Loading health data..."
          size="lg"
          className="min-h-[400px]"
        />
      );
    }

    return (
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Citizen View</h2>
        <ul className="list-disc pl-4">
          <li>Report my symptoms</li>
          <li>See simplified local summary (anonymized)</li>
        </ul>

        <h3 className="text-lg font-medium mt-4">Summary by Disease</h3>
        <pre className="bg-gray-100 p-3 rounded-md text-sm">
          {JSON.stringify(data.byDisease, null, 2)}
        </pre>
      </div>
    );
  }

  // ASHA view
  if (mode === "asha") {
    const userName =
      user?.fullName ||
      (user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName || user?.primaryEmailAddress?.emailAddress || "User");

    // Calculate record counts for stats (hooks are already called at top level)
    const draftCount = Array.isArray(allRecords)
      ? allRecords.filter((r: any) => r.status !== "registered").length
      : 0;
    const registeredCount = Array.isArray(registeredRecords)
      ? registeredRecords.length
      : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Beautiful Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg">
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold flex items-center gap-3">
                    <span>Asha Dashboard 🩺</span>
                  </h1>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-blue-100 text-lg font-medium">
                    Welcome back,{" "}
                    <span className="text-white font-semibold">{userName}</span>
                    !
                  </p>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                    <span className="text-sm font-medium">Active Worker</span>
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                  </div>
                  <Button
  onClick={() => signOut({ redirectUrl: window.location.origin })}
  className="text-white font-semibold rounded-full px-5 py-2
             bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500
             hover:from-red-600 hover:via-red-500 hover:to-red-400
             shadow-md hover:shadow-lg hover:shadow-red-500/40
             transition-all duration-300 active:scale-95"
>
  Logout
</Button>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/90 backdrop-blur-sm border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Draft Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {draftCount}
                  </span>
                  <span className="text-gray-500 text-sm">records</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Pending registration
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-2 border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Registered Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {registeredCount}
                  </span>
                  <span className="text-gray-500 text-sm">records</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Successfully registered
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Total Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {draftCount + registeredCount}
                  </span>
                  <span className="text-gray-500 text-sm">total</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  All records combined
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 p-6 lg:p-8 mb-8">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 p-1 rounded-lg mb-6">
                <TabsTrigger
                  value="create"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 font-semibold"
                >
                  ✏️ Create Record
                </TabsTrigger>
                <TabsTrigger
                  value="saved"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 font-semibold"
                >
                  📝 Saved/Edit
                </TabsTrigger>
                <TabsTrigger
                  value="registered"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 font-semibold"
                >
                  ✅ Registered
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="mt-6">
                <CreateRecordForm />
              </TabsContent>

              <TabsContent value="saved" className="mt-6">
                <SavedEditRecords />
              </TabsContent>

              <TabsContent value="registered" className="mt-6">
                <RegisteredRecords />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  // Admin view
  return <AdminInterface />;
}
