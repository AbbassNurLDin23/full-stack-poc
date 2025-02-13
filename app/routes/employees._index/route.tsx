import { Link, useLoaderData } from "react-router";
import { getDB } from "~/db/getDB";
import { useState } from "react";

export async function loader() {
  const db = await getDB();
  const employees = await db.all("SELECT * FROM employees;");
  return { employees };
}

export default function EmployeesPage() {
  const { employees } = useLoaderData();
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");

  // Filter employees based on ID, name, and email.
  const filteredEmployees = employees.filter((employee: any) => {
    const matchesId = searchId ? employee.id.toString() === searchId : true;
    const matchesName = searchName
      ? employee.full_name.toLowerCase().includes(searchName.toLowerCase())
      : true;
    const matchesEmail = searchEmail
      ? employee.email.toLowerCase().includes(searchEmail.toLowerCase())
      : true;
    return matchesId && matchesName && matchesEmail;
  });

  return (
    <div>
      <h1>Employees</h1>

      {/* Search Bars */}
      <div className="search-bar" style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Search by ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          style={{ padding: "8px", width: "150px", marginRight: "16px" }}
        />
        <input
          type="text"
          placeholder="Search by Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          style={{ padding: "8px", width: "200px", marginRight: "16px" }}
        />
        <input
          type="text"
          placeholder="Search by Email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          style={{ padding: "8px", width: "200px" }}
        />
      </div>

      <table className="employee-table" cellPadding="8" cellSpacing="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Phone Number</th>
            <th>Job Title</th>
            <th>Department</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((employee: any) => (
            <tr key={employee.id}>
              <td>{employee.id}</td>
              <td>{employee.full_name}</td>
              <td>{employee.email}</td>
              <td>{employee.phone_number}</td>
              <td>{employee.job_title}</td>
              <td>{employee.department}</td>
              <td>
                <Link to={`/employees/${employee.id}`}>
                  <button className="view-button">View Details</button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />
      <h2>Navigation</h2>
      <ul>
        <li>
          <a href="/employees/new">New Employee</a>
        </li>
        <li>
          <a href="/timesheets/">Timesheets</a>
        </li>
      </ul>
    </div>
  );
}
