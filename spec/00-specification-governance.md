# Atlas OS Specification Governance

**Status:** Draft  
**Version:** 0.1

## Purpose

This document defines the governance rules for authoring, reviewing, accepting, versioning, publishing, interpreting, and amending the Atlas OS Specification.

It establishes:

- the authority of the specification;
- the relationship between specification documents;
- the use of normative language;
- the required structure of specification documents;
- the lifecycle and versioning of specification documents;
- dependency and precedence rules;
- requirement identification rules;
- terminology governance;
- acceptance criteria;
- amendment and supersession procedures;
- the relationship between the normative specification and non-normative Architecture Decision Records.

This document governs the specification itself. It does not define Atlas runtime behavior, architecture, protocols, interfaces, persistence, security, or implementation mechanisms.

## Dependencies

This document depends on:

1. The Engineering Constitution.
2. The frozen Atlas OS Specification Architecture, Version 1.0.

The Engineering Constitution governs the engineering philosophy under which the Atlas OS Specification is created and maintained.

The frozen Atlas OS Specification Architecture defines:

- the specification document set;
- document filenames;
- document ordering;
- document dependencies;
- normative boundaries;
- the separation between the specification and Architecture Decision Records;
- the authoring sequence.

This document may formalize the governance mechanisms required to maintain that architecture, but it must not redesign or expand the frozen specification architecture.

## Definitions

### Accepted

A document status indicating that a specification document has completed review, satisfies the acceptance criteria defined by this document, and forms part of the current normative Atlas OS Specification.

### Architecture Decision Record

A non-normative record that documents the context, decision, alternatives, consequences, and history of an architectural decision.

Architecture Decision Records are stored under the `adr/` directory.

### Canonical Specification

The current set of Accepted documents under the `spec/` directory.

Only the Canonical Specification defines the current normative architecture and behavior of Atlas OS.

### Conflict

A condition in which two normative statements cannot both be satisfied under the same interpretation and circumstances.

### Dependency

A specification document that defines concepts, principles, requirements, or behavior relied upon by another specification document.

### Derived Document

A specification document whose purpose is to organize, normalize, map, or summarize requirements established elsewhere in the specification.

A Derived Document may clarify relationships and terminology but must not create independent Atlas runtime behavior.

### Document Prefix

A stable uppercase identifier assigned to a specification document for use in requirement identifiers.

### Draft

A document status indicating that a specification document is incomplete, under active authorship, under revision, or not yet accepted as normative.

### Editorial Change

A change that corrects spelling, grammar, formatting, broken references, numbering, or other presentation defects without changing the meaning, scope, applicability, or interpretation of a normative statement.

### Future Consideration

A non-normative possibility that may be evaluated in a future design or specification phase.

A Future Consideration does not authorize implementation and must not be interpreted as planned or required behavior.

### Implementation-Independent

A property of a requirement that defines externally meaningful concepts, invariants, responsibilities, behavior, constraints, or guarantees without requiring a specific programming language, framework, database, cloud provider, deployment topology, repository organization, or physical implementation technique.

### Inconsistency

A contradiction, unresolved mismatch, ambiguous overlap, terminology collision, dependency violation, or incompatible interpretation within or between specification documents.

### Informative Content

Content provided to explain context, rationale, examples, consequences, or future possibilities without establishing a conformance obligation.

### Normative Content

Content that defines required, prohibited, recommended, or permitted characteristics of Atlas OS or of a conforming implementation.

### Open Question

An explicitly unresolved issue whose answer has not yet been accepted into the specification.

An Open Question is non-normative.

### Requirement

An atomic normative statement that defines a mandatory, prohibited, recommended, or permitted property of Atlas OS, a specification document, or a conforming implementation.

### Requirement Identifier

A stable identifier assigned to an individual requirement.

A Requirement Identifier consists of a Document Prefix, a hyphen, and a three-digit sequence number.

Example:

```text
GOV-001
```

### Review

The formal evaluation of a Draft specification document for completeness, consistency, precision, dependency compliance, implementation independence, and readiness for acceptance.

### Specification Architecture

The frozen definition of the Atlas OS specification document set, hierarchy, dependencies, boundaries, and authoring order.

### Specification Document

A Markdown document under the `spec/` directory that forms, or is intended to form, part of the Canonical Specification.

### Specification Release

An identified publication of a mutually consistent set of Accepted specification document versions.

### Superseded

A document status indicating that a previously Accepted document is no longer the current normative version because it has been replaced by a newer Accepted version or document.

### Withdrawn

A document status indicating that a Draft or review candidate has been abandoned and will not become normative in its current form.

## Specification

### 1. Scope of governance

This document governs all Markdown documents under the `spec/` directory.

It governs:

- document structure;
- document status;
- document versioning;
- normative language;
- requirement identifiers;
- dependency handling;
- precedence;
- conflict handling;
- terminology consistency;
- document review;
- document acceptance;
- specification amendments;
- specification publication;
- document supersession.

This document also governs the relationship between the `spec/` and `adr/` directories.

This document does not govern:

- source code;
- implementation repositories;
- implementation release procedures;
- deployment processes;
- test frameworks;
- operational runbooks;
- project management systems;
- user documentation;
- SDK documentation;
- vendor-specific integration documentation.

Those materials may reference the Canonical Specification but may not redefine it.

### 2. Canonical specification location

The normative Atlas OS Specification resides under:

```text
spec/
```

Architecture Decision Records reside under:

```text
adr/
```

Documents outside the `spec/` directory are non-normative unless an Accepted specification document explicitly incorporates a specific external definition by reference.

References to design discussions, issue trackers, implementation notes, meeting transcripts, prototypes, or Architecture Decision Records do not make those materials normative.

The Canonical Specification consists only of the current Accepted version of each applicable specification document.

### 3. Frozen specification architecture

The Specification Architecture is frozen at Version 1.0.

The following properties are considered part of the frozen architecture:

- specification filenames;
- specification document purposes;
- specification hierarchy;
- document dependencies;
- document ordering;
- document boundaries;
- normative boundaries;
- the separation of architectural history into the `adr/` directory;
- the authoring sequence.

A change to any frozen architectural property requires:

1. an Accepted Architecture Decision Record;
2. an explicit revision to the Specification Architecture;
3. corresponding revisions to affected specification documents;
4. verification that the revised architecture remains internally consistent.

An Architecture Decision Record alone does not modify the Specification Architecture.

A discussion, implementation, prototype, or repository change does not modify the Specification Architecture.

### 4. Normative authority

An Accepted specification document is normative within its defined scope.

A Draft, Withdrawn, or Superseded document is not part of the current Canonical Specification.

A document under review remains Draft until explicitly Accepted.

Architecture Decision Records are non-normative.

Implementation behavior, source code, tests, generated schemas, and operational practice are not authoritative when they conflict with the Canonical Specification.

Where implementation behavior differs from the Canonical Specification, the implementation is non-conforming unless the specification is subsequently amended through the defined governance process.

Observed implementation behavior must not be used to silently reinterpret normative text.

### 5. Specification hierarchy and precedence

The specification hierarchy is:

1. Engineering Constitution
2. Atlas Mission
3. Atlas Design Principles
4. Atlas Kernel
5. Atlas Service Architecture
6. Atlas Interaction Model
7. Atlas Protocol Specifications
8. Atlas Interface and Persistence Specifications
9. Atlas Cross-Cutting Requirements
10. Atlas Conformance Requirements

A lower-level document may elaborate on a higher-level document.

A lower-level document must not redefine, weaken, contradict, or bypass a higher-level document.

Where two normative statements at different levels conflict, the higher-level statement has precedence.

Precedence does not make the conflict acceptable. The conflict must still be recorded and corrected.

Where two normative statements at the same level conflict, neither statement automatically takes precedence. The inconsistency must be explicitly identified and resolved through specification revision.

A more specific statement must not be assumed to override a more general statement unless the higher-authority document explicitly permits that specialization.

### 6. Normative language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are normative only when written in uppercase.

Their meanings are:

#### MUST, REQUIRED, and SHALL

The stated behavior or property is mandatory.

A conforming implementation or specification document must satisfy the requirement without exception unless another Accepted requirement explicitly defines a permitted exception.

#### MUST NOT and SHALL NOT

The stated behavior or property is prohibited.

A conforming implementation or specification document must not exhibit the prohibited behavior.

#### SHOULD and RECOMMENDED

The stated behavior or property is strongly recommended.

A conforming implementation may depart from the recommendation only when a documented reason demonstrates that the alternative preserves all applicable higher-priority requirements and invariants.

#### SHOULD NOT

The stated behavior or property is strongly discouraged.

A conforming implementation may perform the discouraged behavior only when a documented reason demonstrates that the behavior does not violate applicable requirements or invariants.

#### MAY and OPTIONAL

The stated behavior or property is permitted but not required.

An implementation that omits Optional behavior remains conforming unless another requirement makes that behavior mandatory under specific conditions.

Normative meaning is not limited to sentences containing uppercase key words.

A declarative statement in a normative section that defines Atlas behavior, identity, ownership, boundaries, states, transitions, invariants, or guarantees is normative unless explicitly marked informative.

Examples, rationale, notes, and explanatory text must not be interpreted as creating new requirements unless the text is explicitly identified as normative.

### 7. Required document structure

Every specification document must contain the following sections in this order:

1. Title
2. Status
3. Version
4. Purpose
5. Dependencies
6. Definitions
7. Specification
8. Requirements
9. Non-goals
10. Open Questions
11. Future Considerations

A document may contain subsections within these required sections.

A document may not omit a required section.

Where a required section has no applicable content, the section must remain present and explicitly state that no items are currently defined.

The required sections have the following roles.

#### Title

Identifies the specification document using its canonical document name.

#### Status

Declares the document lifecycle status.

#### Version

Declares the document version.

#### Purpose

Defines the document’s scope, authority, and intended responsibility.

The Purpose section must make clear what the document owns and what it does not own.

#### Dependencies

Lists the specification documents and external governing authorities on which the document normatively depends.

#### Definitions

Defines terms required to interpret the document.

Definitions must not silently conflict with `02-terminology.md` after that document becomes Accepted.

#### Specification

Contains the complete normative model governed by the document, including relevant concepts, invariants, behavior, boundaries, states, relationships, and constraints.

#### Requirements

Contains atomic, identified normative requirements derived from the Specification section.

#### Non-goals

Defines matters intentionally excluded from the document’s scope.

Non-goals are normative scope boundaries but do not define runtime behavior.

#### Open Questions

Records unresolved matters that have not been accepted.

Open Questions are non-normative and must not be treated as implementation authorization.

#### Future Considerations

Records non-normative possibilities that may be considered later.

Future Considerations must not introduce implied commitments.

### 8. Document statuses

Specification documents use the following lifecycle statuses:

- Draft
- Accepted
- Superseded
- Withdrawn

#### Draft

A Draft document may be incomplete or unstable.

A Draft document may contain unresolved inconsistencies or Open Questions.

A Draft document is not part of the Canonical Specification.

#### Accepted

An Accepted document has satisfied all acceptance criteria.

An Accepted document is normative.

An Accepted document must identify its exact version.

An Accepted document may contain Open Questions only when those questions are explicitly non-blocking and cannot alter the interpretation of any Accepted requirement.

#### Superseded

A Superseded document was previously Accepted but has been replaced.

A Superseded document is retained only for historical reference.

A Superseded document is not part of the current Canonical Specification.

#### Withdrawn

A Withdrawn document has been abandoned before becoming the current Accepted specification.

A Withdrawn document is non-normative.

The planning statuses used by the frozen Specification Architecture, including “Accepted — Ready to Author,” “Derived — Ready to Author,” “Planned — Design Required,” and “Required Gap — Not Designed,” describe authoring readiness.

They are not specification document lifecycle statuses and must not appear as the Status value of an authored specification document.

### 9. Document versioning

Specification documents use a two-part version number:

```text
MAJOR.MINOR
```

Examples:

```text
0.1
1.0
1.1
2.0
```

#### Pre-acceptance versions

Versions below `1.0` are Draft versions.

The first complete authored draft should normally use Version `0.1`.

A Draft revision that changes normative meaning, structure, terminology, or requirements increments the MINOR number.

Examples:

```text
0.1 → 0.2
0.2 → 0.3
```

#### Initial acceptance

The first Accepted version of a document is Version `1.0`.

#### Minor accepted revisions

The MINOR number increments when an Accepted revision:

- adds backward-compatible normative detail;
- clarifies an ambiguity without changing an established invariant;
- adds a requirement that does not invalidate existing conforming behavior;
- expands definitions without altering the meaning of existing requirements;
- corrects an omission without changing the document’s architectural role;
- applies Editorial Changes after acceptance.

Examples:

```text
1.0 → 1.1
1.1 → 1.2
```

#### Major accepted revisions

The MAJOR number increments when an Accepted revision:

- changes an established invariant;
- removes or materially weakens a requirement;
- changes the meaning of a canonical term;
- changes architectural ownership;
- changes a required state or transition;
- changes the interpretation of previously conforming behavior;
- introduces a compatibility break;
- changes the document’s normative scope;
- supersedes a prior architectural model.

Examples:

```text
1.4 → 2.0
2.3 → 3.0
```

When the MAJOR number increments, the MINOR number resets to zero.

Editorial Changes must still be versioned after acceptance so that every published text has an exact identity.

Document versions must not be changed without a corresponding change to document content or status.

### 10. Requirement identifiers

Every atomic requirement in the Requirements section must have a stable Requirement Identifier.

Requirement Identifiers use the format:

```text
<PREFIX>-<NNN>
```

Where:

- `<PREFIX>` is the document’s stable uppercase Document Prefix;
- `<NNN>` is a zero-padded three-digit sequence number.

Examples:

```text
GOV-001
GOV-002
GOV-003
```

Each specification document must declare its Document Prefix before defining requirements.

Requirement Identifiers must be unique across the Canonical Specification.

Once assigned, a Requirement Identifier must not be reused for a different requirement.

When a requirement is removed, its identifier must be retired.

When a requirement is materially divided into multiple requirements, the original identifier must either:

- remain attached to the requirement that preserves its primary meaning; or
- be retired and replaced with new identifiers.

When multiple requirements are consolidated, the retained identifier must be explicitly documented, and all retired identifiers must not be reused.

A wording change that preserves normative meaning retains the existing Requirement Identifier.

A change that materially alters the obligation requires either a MAJOR document version or a clearly traceable replacement requirement.

### 11. Atomic requirements

A requirement should define one independently interpretable obligation.

A requirement must identify:

- the obligated subject;
- the required, prohibited, recommended, or permitted behavior;
- any condition under which the requirement applies;
- any relevant result or guarantee.

A requirement must not combine unrelated obligations solely to reduce the number of identifiers.

A requirement must not depend on examples to determine its normative meaning.

A requirement must not use ambiguous qualifiers such as:

- appropriate;
- reasonable;
- sufficient;
- normal;
- proper;
- relevant;
- adequate;
- meaningful;
- timely;

unless the document defines the criterion by which the qualifier is evaluated.

Where exact quantification is intentionally deferred, the requirement must identify the authority or later specification responsible for defining the missing criterion.

### 12. Dependencies

Every specification document must declare all normative dependencies in its Dependencies section.

A document depends on another document when correct interpretation of the dependent document requires concepts, principles, requirements, or behavior defined by the dependency.

An informative citation does not create a normative dependency.

A dependent document must not become Accepted before its required dependencies are Accepted, except for `00-specification-governance.md`, whose acceptance establishes the governance process used for subsequent documents.

A dependent document must use the current Accepted version of each dependency during review.

If a dependency changes, all dependent documents must be evaluated for impact.

A dependency change does not automatically change a dependent document’s version.

A dependent document’s version must change when the dependency revision requires a corresponding change to its text, requirements, interpretation, or conformance obligations.

Circular normative dependencies are prohibited unless the frozen Specification Architecture explicitly defines them.

A document must not create a new dependency that violates the frozen authoring order or document boundaries.

### 13. Terminology governance

Stable terminology is required for specification consistency.

Until `02-terminology.md` becomes Accepted:

- each document must define the terms required for its own interpretation;
- accepted source terminology must be preserved;
- terminology differences must be explicitly identified;
- terms must not be silently renamed or normalized;
- a document must not assume that similar terms are synonymous unless the accepted design establishes that relationship.

After `02-terminology.md` becomes Accepted:

- its definitions become canonical across the specification;
- other documents must use canonical terms consistently;
- a local definition must not contradict a canonical definition;
- a local definition may narrow a term only when the narrowed scope is explicit and does not alter the canonical meaning;
- deprecated terms must be identified as aliases and must not create alternate semantics.

A terminology inconsistency discovered during authoring must be recorded explicitly.

An author must not resolve a terminology inconsistency by selecting one term without identifying the competing accepted usage.

### 14. Implementation independence

Specification requirements must define Atlas independently of implementation technology.

A specification document may define:

- abstract entities;
- identities;
- ownership;
- relationships;
- invariants;
- responsibilities;
- state models;
- transitions;
- protocols;
- operations;
- inputs and outputs;
- observable behavior;
- failure semantics;
- persistence guarantees;
- security properties;
- conformance obligations.

A specification document must not require:

- a programming language;
- a software framework;
- a database product;
- a cloud provider;
- a deployment platform;
- a physical repository structure for an implementation;
- a class hierarchy;
- a specific module layout;
- a physical database schema;
- a visual interface design;
- a vendor-specific service;
- a specific internal algorithm;

unless the frozen Specification Architecture is formally revised to permit such a requirement.

An abstract mechanism may be specified when the mechanism itself is part of Atlas semantics rather than an implementation technique.

Performance, capacity, availability, latency, durability, and security requirements may be normative when expressed as implementation-independent guarantees.

### 15. Derived documents

A Derived Document may:

- normalize terminology;
- map internal concepts to user-facing concepts;
- organize accepted concepts;
- describe relationships among specification layers;
- provide navigation across the specification;
- clarify which document owns a concept.

A Derived Document must not:

- create new runtime behavior;
- create new architectural primitives;
- create new services;
- create new protocol states;
- create new implementation obligations not established by an owning normative document;
- resolve an inconsistency without identifying and correcting the owning documents.

Where a Derived Document reveals a conflict between source documents, the conflict must be corrected in the source documents.

The Derived Document must not become the sole authority for behavior owned by another document.

### 16. Normative and informative sections

The following sections are normative unless specific content is explicitly marked informative:

- Purpose;
- Dependencies;
- Definitions;
- Specification;
- Requirements;
- Non-goals.

The following sections are non-normative:

- Open Questions;
- Future Considerations.

Within a normative section, examples, rationale, commentary, and explanatory notes are informative unless explicitly designated normative.

Informative content must not contradict normative content.

An implementation must not rely on informative content to satisfy an obligation that is absent from the normative text.

A requirement must not be placed only in an Open Question or Future Consideration.

### 17. Open Questions

An Open Question records an unresolved matter.

Each Open Question should state:

- the unresolved issue;
- why it matters;
- which documents or requirements may be affected;
- whether it blocks acceptance.

An Accepted document may contain a non-blocking Open Question only when all of the following are true:

1. the question does not change the meaning of any Accepted requirement;
2. the question does not create multiple valid interpretations of required behavior;
3. the question does not leave an invariant undefined;
4. the question does not prevent conformance evaluation;
5. the question is explicitly identified as non-blocking.

A blocking Open Question prevents document acceptance.

An Open Question must not be answered through implementation behavior alone.

Resolution of an Open Question requires an explicit specification revision and, where the resolution constitutes an architectural decision, an Accepted Architecture Decision Record.

### 18. Future Considerations

Future Considerations record possibilities outside the current normative scope.

A Future Consideration must not:

- use normative requirement language;
- imply that a feature is committed;
- imply that an implementation should anticipate unspecified behavior;
- weaken a current requirement;
- authorize an extension that is not otherwise permitted;
- be required for conformance.

A Future Consideration that becomes accepted design must be moved into the appropriate normative section through a versioned specification revision.

### 19. Non-goals

Non-goals define intentional scope boundaries.

A Non-goal must identify behavior, responsibility, or design territory that the document intentionally does not define.

A Non-goal must not contradict the document’s Purpose or Requirements.

A Non-goal must not be used to bypass an obligation established by a higher-precedence document.

A topic excluded by one document may be owned by another document when the Specification Architecture assigns that responsibility elsewhere.

### 20. Inconsistency handling

An inconsistency discovered during authoring or review must be identified explicitly.

The inconsistency record must include:

- the conflicting statements or concepts;
- the affected documents;
- the applicable precedence relationship;
- whether the inconsistency blocks acceptance;
- the specification revision required to resolve it.

An author must not silently resolve an inconsistency by:

- changing accepted terminology;
- omitting conflicting source material;
- weakening one statement;
- selecting one interpretation;
- introducing an unaccepted abstraction;
- relocating ownership between documents;
- altering dependency direction.

An inconsistency that affects normative meaning blocks acceptance.

An inconsistency that is purely editorial may be corrected without an Architecture Decision Record.

An inconsistency caused by an unresolved architectural decision requires an Architecture Decision Record before the normative specification is changed.

### 21. Architecture Decision Records

Architecture Decision Records reside under:

```text
adr/
```

The `adr/README.md` document defines the ADR format, numbering, statuses, acceptance process, and supersession rules.

Architecture Decision Records are non-normative.

An Accepted Architecture Decision Record records that a decision has been approved.

It does not make the decision normative until the affected specification documents are revised and Accepted.

Where an Architecture Decision Record conflicts with the Canonical Specification, the Canonical Specification remains authoritative.

A specification document should reference an ADR when the ADR provides relevant historical rationale, but the specification must remain understandable and complete without requiring the reader to consult the ADR.

A specification requirement must not exist only in an ADR.

An ADR is required when a change:

- alters the frozen Specification Architecture;
- changes an architectural primitive;
- changes an invariant;
- changes architectural ownership;
- changes a service boundary;
- changes a protocol model;
- changes canonical terminology in a way that affects meaning;
- introduces or removes a significant architectural constraint;
- supersedes a previously accepted architectural decision.

An ADR is not required for an Editorial Change that does not alter normative meaning.

### 22. Authoring process

Specification documents are authored one at a time in the dependency order defined by the frozen Specification Architecture.

The authoring process for each document is:

1. gather the accepted design material within the document’s scope;
2. preserve accepted decisions;
3. organize the material according to the required document structure;
4. normalize wording without changing meaning;
5. define required terms;
6. express normative behavior precisely;
7. extract atomic requirements;
8. identify inconsistencies;
9. identify missing design;
10. record unresolved matters as Open Questions;
11. record deferred possibilities as Future Considerations;
12. review the document against its dependencies;
13. assign a Draft version;
14. submit the complete document for review;
15. revise the document without silently redesigning accepted architecture;
16. accept the document only after all acceptance criteria are satisfied.

Authoring must not be used as an implicit design process.

Where accepted material is insufficient to define required normative behavior, the document must identify the missing design rather than inventing it.

### 23. Review criteria

A specification review must evaluate:

- scope correctness;
- dependency compliance;
- hierarchy compliance;
- consistency with accepted design;
- terminology consistency;
- implementation independence;
- completeness;
- requirement atomicity;
- requirement testability;
- ambiguity;
- ownership clarity;
- conflict with other documents;
- accidental introduction of new design;
- accidental omission of accepted design;
- correct separation of normative and informative material;
- correct use of Open Questions and Future Considerations.

Review comments must distinguish among:

- editorial defects;
- ambiguity;
- inconsistency;
- missing accepted material;
- missing design;
- architectural change proposals;
- implementation concerns.

An architectural change proposal must not be applied as an editorial correction.

### 24. Acceptance criteria

A specification document may become Accepted only when all of the following are true:

1. All required sections are present.
2. The document has a canonical title.
3. The document declares an exact version.
4. The document declares its lifecycle status.
5. The document declares all normative dependencies.
6. All required dependencies are Accepted.
7. The document conforms to the frozen Specification Architecture.
8. The document remains within its assigned purpose and boundaries.
9. The document preserves all applicable accepted design decisions.
10. The document introduces no unapproved architectural decisions.
11. All terms required for interpretation are defined or normatively referenced.
12. All runtime obligations are implementation-independent.
13. All atomic requirements have stable Requirement Identifiers.
14. No Requirement Identifier is duplicated or improperly reused.
15. No unresolved inconsistency affects normative meaning.
16. No blocking Open Question remains.
17. Non-blocking Open Questions cannot alter conformance.
18. Future Considerations contain no normative obligations.
19. The document does not depend on ADRs for normative completeness.
20. The document is internally consistent.
21. The document is consistent with all higher-precedence documents.
22. The document is consistent with all applicable peer documents.
23. The document can be interpreted without access to design-session transcripts.
24. The document can be used to evaluate implementation conformance within its scope.
25. Acceptance has been explicitly declared.

Acceptance must not be inferred from silence, implementation activity, publication, repository location, or use by a project.

### 25. Amendment of Accepted documents

An Accepted document may be amended only through a versioned revision.

The amendment process is:

1. identify the reason for change;
2. classify the change as editorial, minor normative, or major normative;
3. identify affected requirements and dependencies;
4. determine whether an ADR is required;
5. produce a Draft revision;
6. update the version number according to this document;
7. review dependent documents for impact;
8. resolve all introduced inconsistencies;
9. complete the acceptance process;
10. explicitly supersede the prior Accepted version.

An amendment must not modify the meaning of an existing Accepted version in place.

Each Accepted text must remain identifiable by its version.

A normative change must not be presented as an Editorial Change.

### 26. Supersession

When a new version of an Accepted document is accepted, the prior Accepted version becomes Superseded.

The superseding version must identify:

- the prior version;
- whether the change is backward-compatible;
- any retired or replaced requirements;
- any affected dependent documents;
- any required migration or compatibility implications, when applicable.

A Superseded document remains part of specification history but is not part of the current Canonical Specification.

Architecture Decision Records may explain the reason for supersession but do not replace the superseding specification text.

### 27. Publication

A Specification Release must identify the exact version and status of every included specification document.

A release must not include a Draft document as though it were Accepted.

A release may include Draft documents only when they are visibly marked Draft and clearly excluded from the Canonical Specification.

The current Canonical Specification must contain no ambiguous duplicate of an Accepted document.

Publication format must preserve:

- headings;
- normative keywords;
- requirement identifiers;
- version information;
- status information;
- internal references;
- code literals;
- tables;
- requirement numbering.

Generated formats may be published for convenience, but the canonical Markdown source remains authoritative unless a future Accepted governance revision defines another canonical representation.

### 28. Conformance relationship

The Canonical Specification defines conformance obligations.

The detailed conformance model is owned by:

```text
80-conformance-and-compatibility.md
```

Until that document becomes Accepted, individual Accepted documents may define requirements within their own scope, but no complete claim of Atlas OS conformance may be made solely from this governance document.

A conforming implementation must not claim that an implementation-specific decision is required by Atlas unless the Canonical Specification establishes that requirement.

Tests may demonstrate conformance but do not redefine the requirement being tested.

### 29. Reference integrity

Normative references between specification documents must identify the target document and, where precision is necessary, the target section or Requirement Identifier.

A reference must not depend solely on heading position when a stable Requirement Identifier exists.

Broken normative references are specification defects.

A change that moves text without changing meaning must preserve or update all affected references.

A requirement must not refer to a Draft document as a normative authority.

### 30. Governance of this document

This document is governed by its own rules after its first acceptance.

Before its first acceptance, revisions remain Draft and are reviewed against:

- the Engineering Constitution;
- the frozen Specification Architecture;
- the accepted purpose of `00-specification-governance.md`.

A future change to this document that alters normative governance requires:

- a versioned revision;
- review of its effect on every specification document;
- an Architecture Decision Record when the change affects the frozen Specification Architecture, document authority, precedence, normative status, or acceptance model.

## Requirements

**Document Prefix:** `GOV`

### Authority and scope

**GOV-001**  
The normative Atlas OS Specification MUST reside under the `spec/` directory.

**GOV-002**  
Architecture Decision Records MUST reside under the `adr/` directory.

**GOV-003**  
Only Accepted specification documents MUST form part of the Canonical Specification.

**GOV-004**  
Draft, Superseded, and Withdrawn documents MUST NOT be treated as current normative authority.

**GOV-005**  
Architecture Decision Records MUST be treated as non-normative.

**GOV-006**  
Implementation behavior MUST NOT override or silently reinterpret the Canonical Specification.

### Frozen architecture

**GOV-007**  
The Specification Architecture MUST remain frozen at Version 1.0 until revised through the approved amendment process.

**GOV-008**  
A change to the frozen Specification Architecture MUST require an Accepted Architecture Decision Record.

**GOV-009**  
An Accepted Architecture Decision Record MUST NOT modify the Specification Architecture without an explicit versioned revision to the architecture.

**GOV-010**  
Specification documents MUST conform to the filenames, purposes, dependencies, boundaries, and authoring order defined by the frozen Specification Architecture.

### Hierarchy and conflicts

**GOV-011**  
A lower-level specification document MUST NOT contradict, weaken, redefine, or bypass a higher-level specification document.

**GOV-012**  
A conflict between documents at different hierarchy levels MUST be interpreted according to the higher-level document until the conflict is corrected.

**GOV-013**  
A conflict between documents at the same hierarchy level MUST be recorded as an inconsistency and MUST NOT be silently resolved.

**GOV-014**  
An inconsistency that affects normative meaning MUST block acceptance of the affected Draft document.

### Document structure

**GOV-015**  
Every specification document MUST contain Title, Status, Version, Purpose, Dependencies, Definitions, Specification, Requirements, Non-goals, Open Questions, and Future Considerations sections.

**GOV-016**  
A required section with no current content MUST remain present and MUST explicitly state that no items are defined.

**GOV-017**  
A specification document MUST remain within the purpose and boundaries assigned by the frozen Specification Architecture.

### Normative language

**GOV-018**  
Uppercase normative key words MUST be interpreted according to the definitions in this document.

**GOV-019**  
A declarative statement defining required Atlas behavior, identity, ownership, boundaries, states, transitions, invariants, or guarantees MUST be treated as normative unless explicitly marked informative.

**GOV-020**  
Informative examples, rationale, and notes MUST NOT create independent requirements.

### Status and versioning

**GOV-021**  
Specification documents MUST use one of the following lifecycle statuses: Draft, Accepted, Superseded, or Withdrawn.

**GOV-022**  
Authoring-readiness statuses from the Specification Architecture MUST NOT be used as specification document lifecycle statuses.

**GOV-023**  
Specification document versions MUST use the `MAJOR.MINOR` format.

**GOV-024**  
Versions below `1.0` MUST have Draft status.

**GOV-025**  
The first Accepted version of a specification document MUST be Version `1.0`.

**GOV-026**  
A change that invalidates previously conforming behavior or changes an established invariant MUST increment the MAJOR version.

**GOV-027**  
A backward-compatible normative addition, clarification, or Editorial Change to an Accepted document MUST increment the MINOR version.

### Requirements

**GOV-028**  
Every atomic requirement MUST have a stable, globally unique Requirement Identifier.

**GOV-029**  
Requirement Identifiers MUST use the `<PREFIX>-<NNN>` format.

**GOV-030**  
A retired Requirement Identifier MUST NOT be reused.

**GOV-031**  
A requirement MUST be interpretable without relying on an example.

**GOV-032**  
A requirement MUST identify the obligated subject and the applicable obligation.

**GOV-033**  
Ambiguous qualitative terms MUST NOT determine conformance unless their evaluation criteria are defined.

### Dependencies

**GOV-034**  
Every specification document MUST declare all normative dependencies.

**GOV-035**  
A dependent document MUST NOT become Accepted before its required dependencies are Accepted, except for the initial acceptance of this governance document.

**GOV-036**  
A change to an Accepted dependency MUST trigger an impact review of dependent documents.

**GOV-037**  
A specification document MUST NOT introduce a dependency that violates the frozen Specification Architecture.

### Terminology

**GOV-038**  
Accepted source terminology MUST be preserved until `02-terminology.md` becomes Accepted.

**GOV-039**  
A terminology inconsistency discovered during authoring MUST be explicitly identified.

**GOV-040**  
After `02-terminology.md` becomes Accepted, specification documents MUST use its canonical definitions unless an explicitly scoped definition preserves the canonical meaning.

**GOV-041**  
Terminology MUST NOT be silently renamed, merged, or treated as synonymous without accepted specification authority.

### Implementation independence

**GOV-042**  
Specification requirements MUST remain implementation-independent.

**GOV-043**  
A specification requirement MUST NOT mandate a programming language, framework, database product, cloud provider, deployment platform, physical implementation structure, or vendor-specific service unless the Specification Architecture is formally revised to permit it.

**GOV-044**  
A specification document MAY define abstract mechanisms when those mechanisms are part of Atlas semantics.

### Derived documents

**GOV-045**  
A Derived Document MUST NOT create independent Atlas runtime behavior.

**GOV-046**  
A conflict identified by a Derived Document MUST be resolved in the owning source documents.

**GOV-047**  
A Derived Document MUST NOT become the sole normative authority for behavior owned by another specification document.

### Open Questions and Future Considerations

**GOV-048**  
Open Questions MUST be treated as non-normative.

**GOV-049**  
A blocking Open Question MUST prevent document acceptance.

**GOV-050**  
A non-blocking Open Question in an Accepted document MUST NOT affect requirement interpretation or conformance evaluation.

**GOV-051**  
Future Considerations MUST NOT create requirements, commitments, or implementation authorization.

### Architecture Decision Records

**GOV-052**  
A requirement MUST NOT exist only in an Architecture Decision Record.

**GOV-053**  
An architectural decision recorded in an ADR MUST become normative only through revision and acceptance of the affected specification documents.

**GOV-054**  
Where an ADR conflicts with the Canonical Specification, the Canonical Specification MUST remain authoritative.

### Authoring and acceptance

**GOV-055**  
Specification authoring MUST preserve accepted architecture and MUST NOT silently introduce new architectural decisions.

**GOV-056**  
Missing design discovered during authoring MUST be identified explicitly rather than invented.

**GOV-057**  
A document MUST satisfy all acceptance criteria defined by this governance specification before receiving Accepted status.

**GOV-058**  
Acceptance MUST be explicit and MUST NOT be inferred from publication, implementation, repository location, silence, or usage.

### Amendments and publication

**GOV-059**  
An Accepted document MUST be amended only through a versioned revision.

**GOV-060**  
A normative change MUST NOT be classified as an Editorial Change.

**GOV-061**  
Acceptance of a new document version MUST supersede the prior Accepted version.

**GOV-062**  
A Specification Release MUST identify the exact version and status of every included document.

**GOV-063**  
Generated publication formats MUST preserve normative language, requirement identifiers, status, version, and references.

**GOV-064**  
The canonical Markdown source MUST remain authoritative unless a future Accepted governance revision defines another canonical representation.

## Non-goals

This document does not define:

1. Atlas OS runtime primitives.
2. Atlas OS services.
3. The Atlas Interaction Model.
4. The Atlas Change Protocol.
5. Change lifecycle states.
6. Review or governance behavior performed by Atlas itself.
7. Validation or assurance behavior performed by Atlas itself.
8. Workspace or context behavior.
9. Adapter behavior.
10. API resources or operations.
11. Storage technology or persistence schemas.
12. Security controls.
13. Failure recovery mechanisms.
14. Complete implementation conformance criteria.
15. Programming languages.
16. Frameworks.
17. Database products.
18. Cloud providers.
19. Deployment topology.
20. Repository layout for a conforming implementation.
21. Test frameworks.
22. Continuous integration procedures.
23. Branch protection rules.
24. Code review procedures for implementation repositories.
25. User interface design.
26. Documentation style outside the normative specification.
27. Project management workflow.
28. The substantive format of Architecture Decision Records beyond the required separation of ADRs from the normative specification.
29. A machine-readable specification representation.
30. A machine-readable requirement schema.

## Open Questions

No blocking Open Questions are currently identified.

The following non-blocking governance questions remain unresolved:

### OQ-1: Specification release versioning

This document defines independent versions for specification documents but does not define a separate version number for the complete Atlas OS Specification release.

A future governance revision may determine whether the specification set requires an independent release version in addition to document versions.

This question does not affect the interpretation or acceptance of individual documents.

### OQ-2: Machine-readable metadata

This document does not define front matter, a metadata schema, or a machine-readable manifest for document status, versions, dependencies, or requirement identifiers.

A future governance revision may define such a representation provided that it does not replace or weaken the human-readable normative Markdown source without explicit acceptance.

This question does not affect the normative meaning of the required document sections.

### OQ-3: Formal requirement verification metadata

This document requires stable Requirement Identifiers but does not define metadata linking requirements to tests, proofs, implementation evidence, or conformance reports.

That relationship is expected to depend on `80-conformance-and-compatibility.md`.

This question does not affect current requirement identity or interpretation.

## Future Considerations

The following items may be considered in future versions of this document:

1. A machine-readable specification manifest.
2. Structured metadata for document versions, statuses, and dependencies.
3. Automated detection of broken normative references.
4. Automated detection of duplicate Requirement Identifiers.
5. Automated validation of required document sections.
6. Automated dependency-order validation.
7. Automated generation of requirement indexes.
8. Automated traceability between requirements and Architecture Decision Records.
9. Automated traceability between requirements and conformance evidence.
10. Formal specification release manifests.
11. A canonical rendered publication format in addition to Markdown.
12. A schema for identifying normative and informative blocks.
13. A formal deprecation process for canonical terminology.
14. A compatibility classification for specification changes.
15. A specification linting tool.
16. A normative reference graph.
17. A requirement coverage report.
18. A governance checklist generated from this document’s requirements.
