import { Link, useLoaderData } from "react-router";
import { useState } from "react";
import { getDB } from "~/db/getDB";

export async function loader() {
  const db = await getDB();
  const timesheetsAndEmployees = await db.all(
    "SELECT timesheets.*, employees.full_name, employees.id AS employee_id FROM timesheets JOIN employees ON timesheets.employee_id = employees.id"
  );

  return { timesheetsAndEmployees };
}

function CalendarView({ events }: { events: any[] }) {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks = [];
  let week: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    week.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(new Date(year, month, day));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null);
    }
    weeks.push(week);
  }

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_time);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <th
              key={day}
              style={{ border: "1px solid #ddd", padding: "0.5rem" }}
            >
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week, weekIndex) => (
          <tr key={weekIndex}>
            {week.map((date, dayIndex) => (
              <td
                key={dayIndex}
                style={{
                  border: "1px solid #ddd",
                  verticalAlign: "top",
                  padding: "0.5rem",
                  height: "100px",
                }}
              >
                {date ? (
                  <div>
                    <strong>{date.getDate()}</strong>
                    <div style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                      {getEventsForDay(date).map((event) => (
                        <div key={event.id}>
                          <Link
                            to={`/timesheets/${event.id}`}
                            style={{ textDecoration: "none", color: "blue" }}
                          >
                            {event.full_name} (
                            {new Date(event.start_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            )
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function TimesheetsPage() {
  const { timesheetsAndEmployees } = useLoaderData();
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [searchTimesheetId, setSearchTimesheetId] = useState("");
  const [searchEmployeeId, setSearchEmployeeId] = useState("");

  // Filter the timesheets based on search criteria
  const filteredTimesheets = timesheetsAndEmployees.filter((timesheet: any) => {
    const matchesTimesheetId = searchTimesheetId
      ? timesheet.id.toString() === searchTimesheetId
      : true;
    const matchesEmployeeId = searchEmployeeId
      ? timesheet.employee_id.toString() === searchEmployeeId
      : true;
    return matchesTimesheetId && matchesEmployeeId;
  });

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={() => setViewMode("table")}
          style={{ fontWeight: viewMode === "table" ? "bold" : "normal" }}
        >
          Table View
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          style={{ fontWeight: viewMode === "calendar" ? "bold" : "normal" }}
        >
          Calendar View
        </button>
      </div>

      {/* Search Bars */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search by Timesheet ID"
          value={searchTimesheetId}
          onChange={(e) => setSearchTimesheetId(e.target.value)}
          style={{ padding: "8px", width: "200px", marginRight: "16px" }}
        />
        <input
          type="text"
          placeholder="Search by Employee ID"
          value={searchEmployeeId}
          onChange={(e) => setSearchEmployeeId(e.target.value)}
          style={{ padding: "8px", width: "200px" }}
        />
      </div>

      {viewMode === "table" ? (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>
                Timesheet ID
              </th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Employee</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>
                Start Time
              </th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>End Time</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTimesheets.map((timesheet: any) => (
              <tr key={timesheet.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "0.5rem" }}>#{timesheet.id}</td>
                <td style={{ padding: "0.5rem" }}>
                  {timesheet.full_name} (ID: {timesheet.employee_id})
                </td>
                <td style={{ padding: "0.5rem" }}>{timesheet.start_time}</td>
                <td style={{ padding: "0.5rem" }}>{timesheet.end_time}</td>
                <td style={{ padding: "0.5rem" }}>
                  <Link to={`/timesheets/${timesheet.id}`}>
                    <button className="view-button">View Details</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <CalendarView events={filteredTimesheets} />
      )}

      <hr style={{ margin: "2rem 0" }} />
      <ul>
        <li>
          <a href="/timesheets/new">New Timesheet</a>
        </li>
        <li>
          <a href="/employees">Employees</a>
        </li>
      </ul>
    </div>
  );
}
