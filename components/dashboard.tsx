"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MedicalLoader } from "@/components/ui/medical-loader";
import { useRole } from "@/lib/useRole";
import { ROLES } from "@/lib/roles";
import { useClerk } from "@clerk/nextjs";

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
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const createRecord = useMutation(api.reports.createDiseaseRecord);
  const userRole = useRole();
  const convexRoleCheck = useQuery(api.reports.checkUserRole);
  const { signOut } = useClerk();
  
  const handleSetRole = async () => {
    try {
      const response = await fetch("/api/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "asha", invite: "ASHA2025" }),
      });
      const data = await response.json();
      if (data.ok) {
        setSaveStatus({ 
          type: "success", 
          message: "Role set successfully! IMPORTANT: Please sign out and sign back in to refresh your session token, then try creating a record again." 
        });
      } else {
        setSaveStatus({ type: "error", message: data.error || "Failed to set role" });
      }
    } catch (error) {
      setSaveStatus({ type: "error", message: "Failed to set role. Please try visiting /after-signin?role=asha&invite=ASHA2025" });
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
        setSaveStatus({ type: "error", message: "Please enter a valid quantity (greater than 0)" });
        return;
      }
      setMedicalSupplies([...medicalSupplies, { name: supplyInput.trim(), quantity }]);
      setSupplyInput("");
      setQuantityInput("");
      setSaveStatus(null);
    } else {
      setSaveStatus({ type: "error", message: "Please enter both supply name and quantity" });
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
      try {
        const verifyResponse = await fetch("/api/verify-role");
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
      setSaveStatus({ type: "success", message: "Record saved successfully! Check the Saved/Edit tab to view it." });
      // Clear success message after 5 seconds
      setTimeout(() => setSaveStatus(null), 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save record";
      setSaveStatus({ 
        type: "error", 
        message: errorMessage
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
            <p><strong>Client-side role (from Clerk):</strong> {userRole}</p>
            <p><strong>Convex sees role:</strong> {convexRoleCheck.role || "Unknown"}</p>
            <p><strong>Convex has permission:</strong> {convexRoleCheck.hasPermission ? "✅ Yes" : "❌ No"}</p>
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">View Full Metadata</summary>
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
            To create disease records, you need to have the <strong>ASHA</strong> or <strong>Admin</strong> role set in your Clerk account.
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
              <p>After setting your role, you <strong>must sign out and sign back in</strong> for the changes to take effect. The authentication token needs to be refreshed.</p>
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
          <Label htmlFor="diseaseName">Disease Name *</Label>
          <Input
            id="diseaseName"
            type="text"
            value={diseaseName}
            onChange={(e) => setDiseaseName(e.target.value)}
            required
            placeholder="Enter disease name"
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label htmlFor="image">Disease Image</Label>
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
          <Label htmlFor="description">Description *</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Enter description about the disease"
            rows={4}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location (e.g., Village, Street, Area)"
          />
        </div>

        {/* Medical Supplies */}
        <div className="space-y-2">
          <Label htmlFor="supplies">Medical Supplies Needed</Label>
          <div className="flex gap-2">
            <Input
              id="supplies"
              type="text"
              value={supplyInput}
              onChange={(e) => setSupplyInput(e.target.value)}
              placeholder="Enter medical supply name"
              className="flex-1"
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
              className="w-24"
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
            >
              Add
            </Button>
          </div>
          {medicalSupplies.length > 0 && (
            <div className="mt-2 space-y-2">
              <Label>Added Supplies:</Label>
              <ul className="space-y-1">
                {medicalSupplies.map((supply, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                  >
                    <span className="text-sm font-medium">
                      {supply.name} - Quantity: {supply.quantity}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSupply(index)}
                      className="text-red-600 hover:text-red-700"
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
        <Button type="submit" disabled={isSaving || !hasPermission} className="w-full">
          {isSaving ? "Saving..." : "Save Record"}
        </Button>
      </form>
    </div>
  );
}

function SavedEditRecords() {
  const records = useQuery(api.reports.getDiseaseRecords);
  const updateRecord = useMutation(api.reports.updateDiseaseRecord);
  const registerRecord = useMutation(api.reports.registerDiseaseRecord);
  const userRole = useRole();
  const { signOut } = useClerk();
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
        medicalSupplies: [...editForm.medicalSupplies, { name: supplyInput.trim(), quantity }],
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
      await updateRecord({
        id: editingId as any,
        diseaseName: editForm.diseaseName,
        description: editForm.description,
        location: editForm.location?.trim() || undefined,
        imageUrl: editForm.imageUrl || undefined,
        medicalSupplies: editForm.medicalSupplies,
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
      await registerRecord({ id: id as any });
      // Success - the record will be removed from draft list and appear in registered tab
      // Convex automatically refreshes queries after mutations
    } catch (error) {
      console.error("Failed to register record:", error);
      alert(error instanceof Error ? error.message : "Failed to register record");
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
            It appears your session token hasn't been updated with your new role. Please sign out and sign back in to refresh your session.
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

  const draftRecords = records.filter(r => r.status === "draft");

  if (draftRecords.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Saved/Edit Records</h3>
        <p className="text-muted-foreground">No saved records found. Create a new record in the Create tab.</p>
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
                      onChange={(e) => setEditForm({ ...editForm!, diseaseName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Image</Label>
                    <Input type="file" accept="image/*" onChange={handleImageChange} />
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
                      onChange={(e) => setEditForm({ ...editForm!, description: e.target.value })}
                      required
                      rows={4}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={editForm?.location || ""}
                      onChange={(e) => setEditForm({ ...editForm!, location: e.target.value })}
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
                      <Button type="button" variant="outline" onClick={handleAddSupply}>
                        Add
                      </Button>
                    </div>
                    {editForm?.medicalSupplies.map((supply, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <span className="text-sm">{supply.name} - Quantity: {supply.quantity}</span>
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
                        Created: {new Date(record.createdAt).toLocaleDateString()}
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
                        {isRegistering === record._id ? "Publishing..." : "Publish"}
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
                      <span className="text-sm text-muted-foreground">{record.location}</span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mb-4">{record.description}</p>
                  {record.medicalSupplies && record.medicalSupplies.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Medical Supplies Needed:</h4>
                      <ul className="space-y-1">
                        {record.medicalSupplies.map((supply: MedicalSupply, index: number) => (
                          <li key={index} className="text-sm">
                            • {supply.name} - Quantity: {supply.quantity}
                          </li>
                        ))}
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
  const records = useQuery(api.reports.getRegisteredRecords);
  const userRole = useRole();
  const { signOut } = useClerk();

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
                    Registered: {new Date(record.updatedAt || record.createdAt).toLocaleDateString()}
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
                  <span className="text-sm text-muted-foreground">{record.location}</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground mb-4">{record.description}</p>
              {record.medicalSupplies && record.medicalSupplies.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Medical Supplies Needed:</h4>
                  <ul className="space-y-1">
                    {record.medicalSupplies.map((supply: MedicalSupply, index: number) => (
                      <li key={index} className="text-sm">
                        • {supply.name} - Quantity: {supply.quantity}
                      </li>
                    ))}
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

export function Dashboard({ mode }: { mode: "admin" | "asha" | "citizen" }) {
  const data = useQuery(api.reports.getVillageSummary, { village: "Bangalore" });
  const { user } = useUser();

  if (!data) return <MedicalLoader message="Loading health data..." size="lg" className="min-h-[400px]" />;

  // Citizen view
  if (mode === "citizen") {
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
    const userName = user?.fullName || 
                     (user?.firstName && user?.lastName 
                       ? `${user.firstName} ${user.lastName}` 
                       : user?.firstName || 
                       user?.primaryEmailAddress?.emailAddress || 
                       "User");
    
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">ASHA Dashboard 🩺</h2>
        <div className="text-lg font-medium text-gray-700">
          Welcome, {userName}!
        </div>
        
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="saved">Saved/Edit</TabsTrigger>
            <TabsTrigger value="registered">Registered</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="mt-4">
            <CreateRecordForm />
          </TabsContent>
          
          <TabsContent value="saved" className="mt-4">
            <SavedEditRecords />
          </TabsContent>
          
          <TabsContent value="registered" className="mt-4">
            <RegisteredRecords />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

























  // Admin view
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Admin Control Panel ⚙️</h2>
      <ul className="list-disc pl-4">
        <li>Monitor all village health reports</li>
        <li>View real-time outbreak trends</li>
        <li>Manage ASHA users and permissions</li>
      </ul>
      <pre className="bg-gray-100 p-3 rounded-md text-sm">
        {JSON.stringify(data.reports, null, 2)}
      </pre>
    </div>
  );
}
