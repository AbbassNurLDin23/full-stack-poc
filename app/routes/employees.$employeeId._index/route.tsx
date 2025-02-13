// app/routes/employees.$employeeId.tsx
import {
  useLoaderData,
  Form,
  redirect,
  useActionData,
  Link,
} from "react-router-dom";
import { getDB } from "~/db/getDB";
import { useEffect, useState } from "react";

interface Employee {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  job_title: string;
  department: string;
  salary: number;
  start_date: string;
  end_date: string | null;
  photo_path: string | null;
  cv_path: string | null;
  id_document_path: string | null;
}

interface LoaderData {
  employee: Employee;
}

interface ActionData {
  error?: string;
}

export function ErrorBoundary() {
  return (
    <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
      <h2 className="text-xl font-bold mb-2">Error Loading Employee</h2>
      <p>Please try again or contact support if the problem persists.</p>
      <a
        href="/employees"
        className="text-blue-600 hover:underline mt-2 inline-block"
      >
        Back to Employees
      </a>
    </div>
  );
}

export async function loader({ params }: { params: { employeeId: string } }) {
  const db = await getDB();
  const employeeId = params.employeeId;

  const id = parseInt(employeeId, 10);
  if (isNaN(id)) {
    throw new Response("Invalid Employee ID", { status: 400 });
  }

  const employee = await db.get("SELECT * FROM employees WHERE id = ?", id);

  if (!employee) {
    throw new Response("Employee Not Found", { status: 404 });
  }

  return { employee };
}

export async function action({
  request,
  params,
}: {
  request: Request;
  params: { employeeId: string };
}) {
  const db = await getDB();
  const formData = await request.formData();
  const employeeId = parseInt(params.employeeId, 10);

  const updates = {
    full_name: formData.get("full_name") as string,
    email: formData.get("email") as string,
    phone_number: formData.get("phone_number") as string,
    date_of_birth: formData.get("date_of_birth") as string,
    job_title: formData.get("job_title") as string,
    department: formData.get("department") as string,
    salary: parseFloat(formData.get("salary") as string),
    start_date: formData.get("start_date") as string,
    end_date: (formData.get("end_date") as string) || null,
  };

  // Validation
  if (!updates.full_name || !updates.email) {
    return { error: "Full name and email are required fields" };
  }

  // Age validation
  const birthDate = new Date(updates.date_of_birth);
  if (isNaN(birthDate.getTime())) {
    return { error: "Invalid date of birth format" };
  }

  const today = new Date();
  const minAgeDate = new Date(today);
  minAgeDate.setFullYear(today.getFullYear() - 18);

  birthDate.setHours(0, 0, 0, 0);
  minAgeDate.setHours(0, 0, 0, 0);

  if (birthDate > minAgeDate) {
    return { error: "Employee must be at least 18 years old" };
  }

  // Start/End date validation
  const startDate = new Date(updates.start_date);
  const endDate = updates.end_date ? new Date(updates.end_date) : null;

  startDate.setHours(0, 0, 0, 0);

  if (endDate) {
    endDate.setHours(0, 0, 0, 0);
    if (startDate > endDate) {
      return { error: "Start date must be before end date" };
    }
  }

  try {
    await db.run(
      `UPDATE employees SET
        full_name = ?,
        email = ?,
        phone_number = ?,
        date_of_birth = ?,
        job_title = ?,
        department = ?,
        salary = ?,
        start_date = ?,
        end_date = ?
       WHERE id = ?`,
      [
        updates.full_name,
        updates.email,
        updates.phone_number,
        updates.date_of_birth,
        updates.job_title,
        updates.department,
        updates.salary,
        updates.start_date,
        updates.end_date,
        employeeId,
      ]
    );

    return redirect(`/employees/${employeeId}`);
  } catch (error) {
    let message = "Failed to update employee";
    if (error instanceof Error) message = error.message;
    return { error: message };
  }
}

export default function EmployeePage() {
  const { employee } = useLoaderData() as LoaderData;
  const actionData = useActionData() as ActionData | undefined;
  const [maxBirthDate, setMaxBirthDate] = useState("");
  const [startDate, setStartDate] = useState(employee.start_date);
  const [endDate, setEndDate] = useState(employee.end_date || "");

  useEffect(() => {
    const today = new Date();
    const minAgeDate = new Date(today);
    minAgeDate.setFullYear(today.getFullYear() - 18);
    setMaxBirthDate(minAgeDate.toISOString().split("T")[0]);
  }, []);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    if (endDate && newStartDate > endDate) {
      setEndDate("");
    }
  };

  const dateError = endDate && startDate > endDate;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Employee</h1>

      {actionData?.error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
          ⚠️ {actionData.error}
        </div>
      )}

      <Form
        method="post"
        className="space-y-6 bg-white p-6 rounded-lg shadow-md"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            <div>
              <label className="block mb-2 font-medium">Full Name</label>
              <input
                name="full_name"
                defaultValue={employee.full_name}
                required
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Email</label>
              <input
                name="email"
                type="email"
                defaultValue={employee.email}
                required
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Phone</label>
              <input
                name="phone_number"
                type="tel"
                defaultValue={employee.phone_number}
                className="w-full p-2 border rounded-md"
                pattern="^\+?[1-9]\d{1,14}$"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Date of Birth</label>
              <input
                name="date_of_birth"
                type="date"
                defaultValue={employee.date_of_birth}
                required
                max={maxBirthDate}
                className="w-full p-2 border rounded-md"
                onInvalid={(e) => {
                  e.currentTarget.setCustomValidity(
                    "Employee must be at least 18 years old"
                  );
                }}
                onInput={(e) => e.currentTarget.setCustomValidity("")}
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Professional Information</h2>
            <div>
              <label className="block mb-2 font-medium">Job Title</label>
              <input
                name="job_title"
                defaultValue={employee.job_title}
                required
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Department</label>
              <input
                name="department"
                defaultValue={employee.department}
                required
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Salary</label>
              <input
                name="salary"
                type="number"
                step="0.01"
                defaultValue={employee.salary}
                required
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Start Date</label>
              <input
                name="start_date"
                type="date"
                defaultValue={employee.start_date}
                required
                className="w-full p-2 border rounded-md"
                onChange={handleStartDateChange}
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">End Date</label>
              <input
                name="end_date"
                type="date"
                defaultValue={employee.end_date || ""}
                className="w-full p-2 border rounded-md"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
              />
              {dateError && (
                <p className="text-red-500 text-sm mt-1">
                  End date cannot be before start date
                </p>
              )}
            </div>
          </div>
        </div>
        <hr />
        <div className="flex justify-between items-center pt-6">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            // disabled={dateError}
          >
            Save Changes
          </button>
        </div>
      </Form>

      <nav className="mt-6">
        <ul className="flex gap-4">
          <li>
            <Link to="/employees" className="text-blue-600 hover:underline">
              Employees
            </Link>
          </li>
          <li>
            <Link to="/employees/new" className="text-blue-600 hover:underline">
              New Employee
            </Link>
          </li>
          <li>
            <Link to="/timesheets" className="text-blue-600 hover:underline">
              Timesheets
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
