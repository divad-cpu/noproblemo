type PrintSection = {
  key: string;
  title: string;
  content: string;
};

type PrintSolution = {
  title: string;
  description: string;
  pros: string;
  cons: string;
  risk: number | null;
  effort: number | null;
  impact: number | null;
  resourcesNeeded: string;
  priority: number | null;
};

type PrintTask = {
  title: string;
  description: string;
  responsiblePerson: string;
  deadline: string;
  completed: boolean;
};

type ChallengePrintReportProps = {
  labels: {
    reportTitle: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    emptyReport: string;
    solutions: string;
    pros: string;
    cons: string;
    risk: string;
    effort: string;
    impact: string;
    resourcesNeeded: string;
    priority: string;
    tasks: string;
    task: string;
    responsiblePerson: string;
    deadline: string;
    completed: string;
    yes: string;
    no: string;
  };
  challenge: {
    title: string;
    shortDescription: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  sections: PrintSection[];
  solutions: PrintSolution[];
  tasks: PrintTask[];
};

function hasValue(value: string | number | null) {
  return value !== null && String(value).trim() !== "";
}

function compactParts(parts: Array<string | number | null>) {
  return parts.filter((part) => hasValue(part)).map(String);
}

export function ChallengePrintReport({
  labels,
  challenge,
  sections,
  solutions,
  tasks,
}: ChallengePrintReportProps) {
  const printableSections = sections.filter((section) => hasValue(section.content));
  const printableSolutions = solutions.filter((solution) =>
    [
      solution.title,
      solution.description,
      solution.pros,
      solution.cons,
      solution.risk,
      solution.effort,
      solution.impact,
      solution.resourcesNeeded,
      solution.priority,
    ].some(hasValue),
  );
  const printableTasks = tasks.filter((task) =>
    [
      task.title,
      task.description,
      task.responsiblePerson,
      task.deadline,
    ].some(hasValue),
  );
  const hasPrintableContent =
    hasValue(challenge.shortDescription) ||
    printableSections.length > 0 ||
    printableSolutions.length > 0 ||
    printableTasks.length > 0;

  return (
    <article className="print-report">
      <header className="print-report-header">
        <p className="print-report-kicker">{labels.reportTitle}</p>
        <h1>{challenge.title}</h1>
        <dl className="print-report-meta">
          <div>
            <dt>{labels.status}</dt>
            <dd>{challenge.status}</dd>
          </div>
          <div>
            <dt>{labels.createdAt}</dt>
            <dd>{challenge.createdAt}</dd>
          </div>
          <div>
            <dt>{labels.updatedAt}</dt>
            <dd>{challenge.updatedAt}</dd>
          </div>
        </dl>
        {hasValue(challenge.shortDescription) ? (
          <p className="print-report-summary">{challenge.shortDescription}</p>
        ) : null}
      </header>

      {!hasPrintableContent ? (
        <p className="print-section">{labels.emptyReport}</p>
      ) : null}

      {printableSections.map((section) => (
        <section key={section.key} className="print-section print-avoid-break">
          <h2>{section.title}</h2>
          <p>{section.content}</p>
        </section>
      ))}

      {printableSolutions.length > 0 ? (
        <section className="print-section">
          <h2>{labels.solutions}</h2>
          <div className="print-compact-list">
            {printableSolutions.map((solution, index) => {
              const scoreParts = compactParts([
                hasValue(solution.risk) ? `${labels.risk}: ${solution.risk}` : null,
                hasValue(solution.effort)
                  ? `${labels.effort}: ${solution.effort}`
                  : null,
                hasValue(solution.impact)
                  ? `${labels.impact}: ${solution.impact}`
                  : null,
                hasValue(solution.priority)
                  ? `${labels.priority}: ${solution.priority}`
                  : null,
              ]);

              return (
                <article
                  key={`${solution.title}-${index}`}
                  className="print-compact-block print-avoid-break"
                >
                  <h3>
                    {index + 1}. {solution.title || labels.solutions}
                  </h3>
                  {hasValue(solution.description) ? (
                    <p>{solution.description}</p>
                  ) : null}
                  {hasValue(solution.pros) ? (
                    <p>
                      <strong>{labels.pros}:</strong> {solution.pros}
                    </p>
                  ) : null}
                  {hasValue(solution.cons) ? (
                    <p>
                      <strong>{labels.cons}:</strong> {solution.cons}
                    </p>
                  ) : null}
                  {scoreParts.length > 0 ? (
                    <p className="print-muted">{scoreParts.join(" | ")}</p>
                  ) : null}
                  {hasValue(solution.resourcesNeeded) ? (
                    <p>
                      <strong>{labels.resourcesNeeded}:</strong>{" "}
                      {solution.resourcesNeeded}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {printableTasks.length > 0 ? (
        <section className="print-section">
          <h2>{labels.tasks}</h2>
          <table className="print-task-table">
            <thead>
              <tr>
                <th>{labels.task}</th>
                <th>{labels.responsiblePerson}</th>
                <th>{labels.deadline}</th>
                <th>{labels.completed}</th>
              </tr>
            </thead>
            <tbody>
              {printableTasks.map((task, index) => (
                <tr key={`${task.title}-${index}`} className="print-avoid-break">
                  <td>
                    <strong>{task.title || `${index + 1}`}</strong>
                    {hasValue(task.description) ? <p>{task.description}</p> : null}
                  </td>
                  <td>{hasValue(task.responsiblePerson) ? task.responsiblePerson : ""}</td>
                  <td>{hasValue(task.deadline) ? task.deadline : ""}</td>
                  <td>{task.completed ? labels.yes : labels.no}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </article>
  );
}
