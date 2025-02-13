import {
  Form,
  Link,
  redirect,
  type ActionFunction,
  useActionData,
} from "react-router-dom";
import { getDB } from "~/db/getDB";
import { useEffect, useState } from "react";

interface ActionData {
  error?: string;
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  // Basic field handling
  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const phone_number = formData.get("phone_number") as string;
  const date_of_birth = formData.get("date_of_birth") as string;
  const job_title = formData.get("job_title") as string;
  const department = formData.get("department") as string;
  const salary = parseFloat(formData.get("salary") as string);
  const start_date = formData.get("start_date") as string;
  const end_date = (formData.get("end_date") as string) || null;

  // Age validation
  const birthDate = new Date(date_of_birth);
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
  const startDateObj = new Date(start_date);
  const endDateObj = end_date ? new Date(end_date) : null;

  startDateObj.setHours(0, 0, 0, 0);

  if (endDateObj) {
    endDateObj.setHours(0, 0, 0, 0);
    if (startDateObj > endDateObj) {
      return { error: "Start date must be before end date" };
    }
  }

  // File handling
  const photo = formData.get("photo") as File | null;
  const cv = formData.get("cv") as File | null;
  const id_document = formData.get("id_document") as File | null;

  try {
    const db = await getDB();
    await db.run(
      `INSERT INTO employees 
      (full_name, email, phone_number, date_of_birth, job_title, department, salary, start_date, end_date, photo_path, cv_path, id_document_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        email,
        phone_number,
        date_of_birth,
        job_title,
        department,
        salary,
        start_date,
        end_date,
        photo?.name || "",
        cv?.name || "",
        id_document?.name || "",
      ]
    );
  } catch (error) {
    return { error: "Failed to create employee. Please try again." };
  }

  return redirect("/employees");
};

export default function NewEmployeePage() {
  const actionData = useActionData() as ActionData | undefined;
  const [maxBirthDate, setMaxBirthDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
      <h1 className="text-3xl font-bold mb-6">Create New Employee</h1>

      {actionData?.error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
          ⚠️ {actionData.error}
        </div>
      )}

      <Form
        method="post"
        encType="multipart/form-data"
        className="space-y-6 bg-white p-6 rounded-lg shadow-md"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            <div>
              <label className="block mb-2 font-medium">Full Name</label>
              <input
                type="text"
                name="full_name"
                required
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Email</label>
              <input
                type="email"
                name="email"
                required
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Phone Number</label>
              <input
                type="tel"
                name="phone_number"
                pattern="^\+?[1-9]\d{1,14}$"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
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
                type="text"
                name="job_title"
                required
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Department</label>
              <input
                type="text"
                name="department"
                required
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Salary ($)</label>
              <input
                type="number"
                name="salary"
                min="1500"
                step="0.01"
                required
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Start Date</label>
              <input
                type="date"
                name="start_date"
                required
                className="w-full p-2 border rounded-md"
                value={startDate}
                onChange={handleStartDateChange}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">End Date</label>
              <input
                type="date"
                name="end_date"
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

        {/* File Uploads */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 font-medium">Employee Photo</label>
              <input
                type="file"
                name="photo"
                accept="image/*"
                className="w-full"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">CV</label>
              <input type="file" name="cv" className="w-full" />
            </div>
            <div>
              <label className="block mb-2 font-medium">ID Document</label>
              <input type="file" name="id_document" className="w-full" />
            </div>
          </div>
        </div>

        <hr />
        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            // disabled={dateError}
          >
            Create Employee
          </button>
          <nav>
            <ul>
              <li>
                <Link to="/employees">Employees</Link>
              </li>
              <li>
                <Link to="/timesheets">Timesheets</Link>
              </li>
            </ul>
          </nav>
        </div>
      </Form>
    </div>
  );
}
