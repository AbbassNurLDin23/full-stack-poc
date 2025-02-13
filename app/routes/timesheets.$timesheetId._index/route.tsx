import { useLoaderData, Form, redirect, useActionData } from "react-router-dom";
import { getDB } from "~/db/getDB";
import { useState } from "react";

interface Employee {
  id: number;
  full_name: string;
}

interface Timesheet {
  id: number;
  summary: string;
  start_time: string;
  end_time: string;
  employee_id: number;
}

interface LoaderData {
  timesheet: Timesheet;
  employees: Employee[];
}

interface ActionData {
  error?: string;
}

export async function loader({ params }: { params: { timesheetId: string } }) {
  const db = await getDB();
  const timesheetId = params.timesheetId;
  const id = parseInt(timesheetId, 10);
  if (isNaN(id)) {
    throw new Response("Invalid timesheet ID", { status: 400 });
  }

  const [timesheet, employees] = await Promise.all([
    db.get("SELECT * FROM timesheets WHERE id = ?", id),
    db.all("SELECT id, full_name FROM employees"),
  ]);

  if (!timesheet) {
    throw new Response("Timesheet not found", { status: 404 });
  }

  return { timesheet, employees };
}

export async function action({
  request,
  params,
}: {
  request: Request;
  params: { timesheetId: string };
}) {
  try {
    const db = await getDB();
    const formData = await request.formData();
    const timesheetId = parseInt(params.timesheetId, 10);
    if (isNaN(timesheetId)) {
      throw new Response("Invalid timesheet ID", { status: 400 });
    }

    const updates = {
      summary: formData.get("summary") as string,
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
      employee_id: parseInt(formData.get("employee_id") as string, 10),
    };

    // Validation
    const errors = [];
    if (!updates.summary) errors.push("Summary is required");
    if (!updates.start_time) errors.push("Start time is required");
    if (!updates.end_time) errors.push("End time is required");
    if (isNaN(updates.employee_id)) errors.push("Employee is required");

    // Date validation
    const startDate = new Date(updates.start_time);
    const endDate = new Date(updates.end_time);
    if (startDate >= endDate) {
      errors.push("End time must be after start time");
    }

    if (errors.length > 0) {
      return { error: errors.join(", ") };
    }

    await db.run(
      `UPDATE timesheets SET
        summary = ?,
        start_time = ?,
        end_time = ?,
        employee_id = ?
       WHERE id = ?`,
      [
        updates.summary,
        startDate.toISOString(),
        endDate.toISOString(),
        updates.employee_id,
        timesheetId,
      ]
    );

    return redirect(`/timesheets/${timesheetId}`);
  } catch (error) {
    let message = "Failed to update timesheet";
    if (error instanceof Error) message = error.message;
    return { error: `${message}` };
  }
}

export default function EditTimesheetPage() {
  const { timesheet, employees } = useLoaderData() as LoaderData;
  const actionData = useActionData() as ActionData | undefined;

  // Convert stored ISO date strings into a format acceptable for datetime-local (YYYY-MM-DDTHH:mm)
  const [startTime, setStartTime] = useState(
    new Date(timesheet.start_time).toISOString().slice(0, 16)
  );
  const [endTime, setEndTime] = useState(
    new Date(timesheet.end_time).toISOString().slice(0, 16)
  );

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Timesheet</h1>

      {actionData?.error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {actionData.error}
        </div>
      )}

      <Form method="post" className="space-y-4">
        <div>
          <label className="block mb-2 font-medium">Summary</label>
          <input
            name="summary"
            defaultValue={timesheet.summary}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Start Time</label>
          <input
            name="start_time"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">End Time</label>
          <input
            name="end_time"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            min={startTime}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Employee</label>
          <select
            name="employee_id"
            defaultValue={timesheet.employee_id}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">Select Employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name} (ID: {employee.id})
              </option>
            ))}
          </select>
        </div>
        <hr />

        <div className="flex gap-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </Form>

      <nav className="mt-6">
        <ul className="flex gap-4">
          <li>
            <a href="/timesheets" className="text-blue-600 hover:underline">
              Timesheets
            </a>
          </li>
          <li>
            <a href="/timesheets/new" className="text-blue-600 hover:underline">
              New Timesheet
            </a>
          </li>
          <li>
            <a href="/employees" className="text-blue-600 hover:underline">
              Employees
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}
