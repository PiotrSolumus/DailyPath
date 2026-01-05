import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Spinner } from "../ui/spinner";

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface Department {
  id: string;
  name: string;
}

interface AssigneeSelectorProps {
  /** Current assignment type: 'user' or 'department' */
  assignedToType: "user" | "department";
  /** Current assigned user ID (if type is 'user') */
  assignedUserId?: string | null;
  /** Current assigned department ID (if type is 'department') */
  assignedDepartmentId?: string | null;
  /** Callback when assignment changes */
  onChange: (type: "user" | "department", id: string | null) => void;
  /** Whether the selector is required (default: true) */
  required?: boolean;
  /** Current user ID (for default selection) */
  currentUserId?: string;
}

async function fetchUsers(): Promise<User[]> {
  const response = await fetch("/api/users");
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
}

async function fetchDepartments(): Promise<Department[]> {
  const response = await fetch("/api/departments");
  if (!response.ok) {
    throw new Error("Failed to fetch departments");
  }
  return response.json();
}

/**
 * AssigneeSelector component - allows selection of task assignee (user or department)
 * 
 * Features:
 * - Radio buttons to switch between user/department assignment
 * - Dropdown with list of users (when user is selected)
 * - Dropdown with list of departments (when department is selected)
 * - React Query for data fetching with caching
 * - Loading states
 * 
 * @example
 * ```tsx
 * <AssigneeSelector
 *   assignedToType="user"
 *   assignedUserId={currentUserId}
 *   onChange={(type, id) => setFormData({ ...formData, assigned_to_type: type, assigned_id: id })}
 *   currentUserId={currentUserId}
 * />
 * ```
 */
export function AssigneeSelector({
  assignedToType,
  assignedUserId,
  assignedDepartmentId,
  onChange,
  required = true,
  currentUserId,
}: AssigneeSelectorProps) {
  const [localType, setLocalType] = useState<"user" | "department">(assignedToType);

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch departments
  const { data: departments, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle type change
  const handleTypeChange = (newType: "user" | "department") => {
    setLocalType(newType);
    
    // Set default value based on type
    if (newType === "user") {
      // Default to current user if available
      const defaultUserId = currentUserId || users?.[0]?.id || null;
      onChange(newType, defaultUserId);
    } else {
      // Default to first department or null
      const defaultDepartmentId = departments?.[0]?.id || null;
      onChange(newType, defaultDepartmentId);
    }
  };

  // Handle assignee ID change
  const handleAssigneeChange = (id: string) => {
    onChange(localType, id || null);
  };

  // Update local type when prop changes
  useEffect(() => {
    setLocalType(assignedToType);
  }, [assignedToType]);

  const isLoading = (localType === "user" && isLoadingUsers) || (localType === "department" && isLoadingDepartments);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>
          Przypisz do <span className="text-destructive">{required ? "*" : ""}</span>
        </Label>
        
        {/* Radio buttons for type selection */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="assigned_to_type"
              value="user"
              checked={localType === "user"}
              onChange={() => handleTypeChange("user")}
              className="h-4 w-4"
            />
            <span className="text-sm">Użytkownik</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="assigned_to_type"
              value="department"
              checked={localType === "department"}
              onChange={() => handleTypeChange("department")}
              className="h-4 w-4"
            />
            <span className="text-sm">Dział</span>
          </label>
        </div>
      </div>

      {/* Conditional dropdown based on type */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner size="sm" />
            <span>Ładowanie...</span>
          </div>
        ) : localType === "user" ? (
          <div>
            <Label htmlFor="assigned_user">
              Wybierz użytkownika {required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              id="assigned_user"
              value={assignedUserId || ""}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              required={required}
            >
              <option value="">-- Wybierz użytkownika --</option>
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.email})
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div>
            <Label htmlFor="assigned_department">
              Wybierz dział {required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              id="assigned_department"
              value={assignedDepartmentId || ""}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              required={required}
            >
              <option value="">-- Wybierz dział --</option>
              {departments?.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}

