import { parseAsString, useQueryState } from "nuqs";

/**
 * Custom hook for task filters with URL sync
 */
export function useTaskFilters() {
  const [status, setStatus] = useQueryState("status", parseAsString);
  const [priority, setPriority] = useQueryState("priority", parseAsString);
  const [departmentId, setDepartmentId] = useQueryState("department_id", parseAsString);
  const [userId, setUserId] = useQueryState("user_id", parseAsString);
  const [isPrivate, setIsPrivate] = useQueryState("is_private", parseAsString);

  return {
    filters: {
      status: status ?? undefined,
      priority: priority ?? undefined,
      department_id: departmentId ?? undefined,
      user_id: userId ?? undefined,
      is_private: isPrivate === "true" ? true : isPrivate === "false" ? false : undefined,
    },
    setStatus,
    setPriority,
    setDepartmentId,
    setUserId,
    setIsPrivate: (value: boolean | null) => setIsPrivate(value === null ? null : value.toString()),
    clearFilters: () => {
      setStatus(null);
      setPriority(null);
      setDepartmentId(null);
      setUserId(null);
      setIsPrivate(null);
    },
  };
}

/**
 * Custom hook for report filters with URL sync
 */
export function useReportFilters() {
  const [startDate, setStartDate] = useQueryState("start_date", parseAsString);
  const [endDate, setEndDate] = useQueryState("end_date", parseAsString);
  const [departmentId, setDepartmentId] = useQueryState("department_id", parseAsString);
  const [userId, setUserId] = useQueryState("user_id", parseAsString);

  return {
    filters: {
      start_date: startDate ?? undefined,
      end_date: endDate ?? undefined,
      department_id: departmentId ?? undefined,
      user_id: userId ?? undefined,
    },
    setStartDate,
    setEndDate,
    setDepartmentId,
    setUserId,
    clearFilters: () => {
      setStartDate(null);
      setEndDate(null);
      setDepartmentId(null);
      setUserId(null);
    },
  };
}
