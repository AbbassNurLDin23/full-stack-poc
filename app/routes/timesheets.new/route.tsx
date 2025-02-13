import { useLoaderData, Form, redirect, useActionData } from "react-router";
import { Link } from "react-router-dom";
import { getDB } from "~/db/getDB";

export async function loader() {
  const db = await getDB();
  const employees = await db.all("SELECT id, full_name FROM employees");
  return { employees };
}

import type { ActionFunction } from "react-router";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const employee_id = formData.get("employee_id");
  const start_time = formData.get("start_time");
  const end_time = formData.get("end_time");
  const summary = formData.get("summary");

  const errors: Record<string, string> = {};

  // Basic field validation
  if (!employee_id) errors.employee_id = "Employee is required";
  if (!start_time) errors.start_time = "Start date and time is required";
  if (!end_time) errors.end_time = "End date and time is required";

  // Date validation using Date objects
  if (start_time && end_time) {
    const startDate = new Date(start_time as string);
    const endDate = new Date(end_time as string);
    if (startDate >= endDate) {
      errors.date = "End date and time must be after start date and time";
    }
  }

  if (Object.keys(errors).length > 0) {
    return errors;
  }

  // Database insertion
  const db = await getDB();
  await db.run(
    "INSERT INTO timesheets (employee_id, start_time, end_time, summary) VALUES (?, ?, ?, ?)",
    [employee_id, start_time, end_time, summary]
  );

  return redirect("/timesheets");
};

export default function NewTimesheetPage() {
  const { employees } = useLoaderData();
  const actionData = useActionData() as Record<string, string> | undefined;

  return (
    <div>
      <h1>Create New Timesheet</h1>
      <Form method="post">
        {/* Employee Selection */}
        <div>
          <label htmlFor="employee_id">Employee</label>
          <select name="employee_id" id="employee_id" required>
            {employees.map((employee: any) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
          {actionData?.employee_id && (
            <p className="error">{actionData.employee_id}</p>
          )}
        </div>

        {/* Date and Time Inputs */}
        <div>
          <label htmlFor="start_time">Start Date and Time</label>
          <input
            type="datetime-local"
            name="start_time"
            id="start_time"
            required
          />
          {actionData?.start_time && (
            <p className="error">{actionData.start_time}</p>
          )}
        </div>

        <div>
          <label htmlFor="end_time">End Date and Time</label>
          <input type="datetime-local" name="end_time" id="end_time" required />
          {actionData?.end_time && (
            <p className="error">{actionData.end_time}</p>
          )}
        </div>

        {/* Summary Input */}
        <div>
          <label htmlFor="summary">Work Summary</label>
          <textarea
            name="summary"
            id="summary"
            rows={4}
            placeholder="Describe the work performed..."
          />
        </div>

        {/* Date Validation Error */}
        {actionData?.date && <p className="error">{actionData.date}</p>}

        <button type="submit">Create Timesheet</button>
      </Form>

      <hr />

      {/* Navigation Links */}
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
  );
}
