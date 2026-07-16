# Atlas OS Service Architecture

**Status:** Draft  
**Version:** 0.2

## Purpose

This document defines the Atlas OS Service Architecture.

The Service Architecture is the mandatory logical layer above the Atlas Kernel.

It assigns canonical ownership for the semantic responsibilities required to make the Kernel operational while preserving the Kernel's exclusive ownership of structural identity, immutable State, atomic Change, State Address, lineage, and Branch visibility.

This document defines:

- the five mandatory Atlas OS Services;
- the responsibility owned by each Service;
- the Kernel primitives each Service may read;
- the Kernel operations each Service may request;
- the Service Results each Service may produce;
- the responsibilities each Service explicitly does not own;
- the required relationships among Services;
- the boundary between Kernel structural integrity and Service-layer Semantic Integrity;
- the logical Services Atlas OS deliberately does not create.

The Atlas OS Service Architecture contains exactly five mandatory logical Services:

1. Governance Service
2. Change Control Service
3. Assurance Service
4. Context and Projection Service
5. Integration Service

These Services are logical responsibility boundaries.

They are not required deployment boundaries.

A conforming implementation may:

- implement multiple Services in one process;
- implement one Service across multiple processes;
- federate a Service across organizational boundaries;
- use different internal modules within a Service.

Implementation topology must not alter Service ownership, Service boundaries, Kernel invariants, or the externally meaningful responsibilities defined here.

This document does not define:

- the exact Engineering Change protocol;
- lifecycle states or transition ordering;
- Governance rules or Authority topology;
- review procedures;
- Assurance Claim or Evidence schemas;
- named Projection definitions;
- Context-selection rules;
- Workspace behavior;
- Adapter contracts;
- API operations;
- persistence mechanisms;
- user-facing interaction concepts.

Those matters belong to later Specification Documents.

## Dependencies

This document normatively depends on:

1. `01-atlas-mission.md`, Version 0.2 Draft.
2. `02-terminology.md`, Version 0.3 Draft.
3. `05-design-principles.md`, Version 0.2 Draft.
4. `10-kernel.md`, Version 0.2 Draft.

This document is governed by:

- `00-specification-governance.md`, Version 0.1 Draft.

The Kernel has precedence over this document.

A Service may interpret, use, or request operations involving System, State, and Change.

A Service must not:

- redefine a Kernel primitive;
- weaken a Kernel invariant;
- mutate State or Change;
- hide or erase a Branch;
- treat a State Head as inherently current or authoritative;
- redefine State as a monolithic whole-System snapshot;
- introduce an additional Kernel primitive.

### Kernel alignment

The Service Architecture depends on the following Kernel model:

- State is an immutable scoped assertion at a State Address;
- one System may contain many State lineages;
- a State Address may have multiple State Heads;
- currentness is expressed through named Projections rather than a monolithic Current State primitive;
- concurrent successors remain structurally visible;
- a Change may create multiple States and may affect multiple Systems atomically.

Service-owned meaning remains above the Kernel:

1. Services interpret Scope References, Facet References, State Content, and Service Results.
2. A durable Service Result becomes represented engineering information only through new State created by Change Control and committed by the Kernel.
3. Governance and protocol determine whether a State or State Head is accepted, selected, or authoritative within a defined scope.
4. The Context and Projection Service produces named views over State and lineage without replacing the Kernel graph.
5. Change Control coordinates Branch selection, rejection, or merge behavior but does not invent the governing decision or Assurance conclusion.

## Definitions

### Assurance Service

The mandatory Service that owns evaluation of whether identified assertions are supported, contradicted, qualified, or unresolved by identified information under stated criteria.

The detailed meanings of Assurance, Claim, Evidence, Validation, and Assurance outcomes belong to `43-validation-and-assurance.md`.

### Change Control Service

The mandatory Service that owns coordination of durable Atlas OS transitions.

The Change Control Service is the sole Service permitted to request establishment of Systems and commitment of Kernel Changes.

The Kernel remains responsible for enforcing structural validity and committing the declared atomic effects.

### Context and Projection Service

The mandatory Service that owns production of provenance-preserving, purpose-specific views derived from Kernel primitives and relevant Service Results.

The Service may produce named currentness, history, trace, audit, drift, and Workspace-oriented Projections.

The detailed meanings of Context and Workspace belong to `44-workspace-and-context.md`.

### Durable Service Result

A Service Result whose meaning must remain available as part of governed Engineering State.

A Durable Service Result may be preserved directly or by immutable reference in State Content through a Kernel Change.

A Durable Service Result is not a Kernel primitive.

### Ephemeral Service Result

A Service Result used during active work that has not been incorporated into governed State through a Kernel Change.

An Ephemeral Service Result must not be presented as durable accepted understanding.

### Governance Service

The mandatory Service that owns evaluation of applicable ownership, Authority, constraints, delegation, exception, escalation, and selection conditions.

The detailed meanings of Governance, Authority, Authorization, and Engineering Review belong to `42-review-and-governance.md`.

### Integration Service

The mandatory Service that owns the semantic boundary between Atlas OS and external engineering systems.

It owns normalization, provenance, mapping, synchronization status, and authorized external actions.

The detailed meanings and contracts of Integration and Adapter belong to `45-integration-and-adapters.md`.

### Logical Service

An architectural responsibility boundary defined independently of process, deployment, repository, team, or organizational topology.

### Projection

A derived representation produced from Kernel primitives, Service Results, or both for a defined purpose.

A Projection may select one or more States or State Heads from multiple State Addresses.

A Projection does not become a Kernel primitive or replace the underlying State and Change graph.

### Semantic Integrity

The preservation of correct meaning, scope, ownership, provenance, uncertainty, and distinctions among Kernel structure, governed conclusions, derived views, proposals, observations, and external information.

Semantic Integrity does not establish that all information is objectively true or sufficient.

It prevents Service interpretation from misrepresenting information's status or meaning.

### Service

A mandatory Logical Service defined by this document.

Capitalized `Service` refers to an Atlas OS logical responsibility boundary.

Lowercase `service` may refer descriptively to an implementation component or external software service.

### Service Architecture

The complete set of mandatory Logical Services, their canonical responsibility boundaries, their permitted relationships with Kernel structure, and their required separation of ownership.

The Service Architecture is defined by this document and is independent of deployment topology.

### Service Boundary

The normative division of responsibilities identifying what a Service owns, what it may read or request, and what it explicitly does not own.

### Service Result

An output produced by a Service.

A Service Result may be ephemeral or durable.

A Service Result is not authoritative or current solely because a Service produced it.

## Specification

### 1. Architectural position

Atlas OS consists of:

- the System-State-Change Kernel;
- the mandatory Service Architecture;
- later protocols that coordinate Service behavior;
- later interfaces through which Actors and systems use Atlas OS;
- later persistence and cross-cutting mechanisms;
- external systems connected through Integration boundaries.

The Kernel preserves structural integrity.

The Service layer establishes and preserves Semantic Integrity.

The Kernel determines whether declared Systems, States, Changes, addresses, predecessor relationships, and atomic effects satisfy Kernel invariants.

Services determine or provide the semantic information required to decide:

- what should be represented;
- which State Heads should participate in a Projection;
- whether a Branch requires resolution;
- whether a proposed Change should be requested;
- how the resulting structure should be understood.

The Services answer distinct classes of questions:

- Governance Service: What ownership, Authority, constraints, exceptions, escalation, or selection conditions apply?
- Change Control Service: What durable transition is being coordinated, and which Kernel Change or non-commit result represents its disposition?
- Assurance Service: What must be supported, what supporting or contradicting information exists, and what conclusion is justified?
- Context and Projection Service: Which information and State Heads should be presented for a defined Actor, purpose, or Engineering Change?
- Integration Service: What occurred in an external system, where did it originate, and how may Atlas OS interact with that system?

No Service may answer all five classes of questions as one undifferentiated responsibility.

### 2. Mandatory Service set

Atlas OS requires exactly five mandatory Logical Services:

1. Governance Service
2. Change Control Service
3. Assurance Service
4. Context and Projection Service
5. Integration Service

All five Service boundaries are mandatory for a conforming Atlas OS architecture.

A conforming implementation may initially provide minimal behavior within a Service boundary.

It must not omit the boundary or transfer its canonical responsibility to an unrelated Service.

| Responsibility area | Canonical owner |
|---|---|
| Ownership and Authority evaluation | Governance Service |
| Constraint, policy, exception, escalation, and selection applicability | Governance Service |
| Engineering Change coordination | Change Control Service |
| Durable transition and rationale association | Change Control Service |
| Branch-resolution coordination | Change Control Service |
| Assurance evaluation | Assurance Service |
| Claim and Evidence relationship | Assurance Service |
| Named Projection and Context assembly | Context and Projection Service |
| Currentness, history, trace, audit, and drift views | Context and Projection Service |
| External-system mapping and synchronization | Integration Service |
| Adapter coordination | Integration Service |
| Structural identity, State Address, lineage, Branches, and atomic Change | Kernel |

Atlas OS must not create a separate mandatory Service merely because a responsibility has a distinct schema, interface, module, deployment, team, or data volume.

A new mandatory Service requires a distinct canonical responsibility that cannot be assigned coherently to an existing Service.

### 3. Logical boundaries versus deployment boundaries

A Service Boundary defines normative ownership.

It does not require:

- a network service;
- an independent process;
- a separate repository;
- a separate database;
- a separate deployment;
- a separate team;
- a public API.

A small implementation may provide all five Services through one runtime.

A large implementation may distribute or federate them.

Co-location must not merge responsibilities.

Distribution must not duplicate canonical ownership.

Every Service Result and requested Kernel Change must remain attributable to its owning Logical Service.

### 4. General Service rules

#### 4.1 Kernel preservation

Every Service must preserve the canonical meanings of System, State, and Change.

A Service must not:

- mutate an existing State;
- alter a committed Change;
- rewrite a State Address;
- suppress a Branch as though it never existed;
- convert a State Head into implicit currentness or authority;
- bypass Kernel invariant enforcement;
- treat a Projection as canonical Kernel State;
- create implicit cross-System effects.

#### 4.2 Durable update path

No Service may directly mutate Kernel structure.

Every durable change to represented Engineering State must be coordinated by the Change Control Service and committed through a Kernel Change.

Other Services may prepare:

- evaluations;
- observations;
- proposed State Content;
- selection or merge recommendations;
- decisions;
- Evidence associations;
- Projection definitions;
- external-action results.

Those outputs become durable represented information only when Change Control coordinates new State and the Kernel commits the Change.

A Service Result may remain durably stored outside State Content when a later persistence specification permits it.

Such storage must not cause the result to be misrepresented as Kernel State or governed current understanding.

#### 4.3 Provenance

Every Service interpretation or result affecting an Engineering Change must retain sufficient provenance to identify:

- the producing Service;
- the applicable System, State Address, Branch, Projection, or Engineering Change;
- the source States and Service Results used;
- external or Actor-provided inputs;
- the applicable scope;
- whether the result is ephemeral or durable.

The exact representation of provenance belongs to later interface and persistence specifications.

#### 4.4 Uncertainty and conflict

A Service must preserve relevant uncertainty, disagreement, incompleteness, and conflicting information.

A Service must not silently:

- select one Branch as authoritative;
- convert a State Head into accepted currentness;
- convert missing information into approval;
- suppress contradictory source information;
- promote an inference into State;
- hide a material difference among named Projections.

A material semantic resolution must occur through an explicit governed process.

When the resolution changes durable represented information, it must be recorded through Change Control and a Kernel Change.

#### 4.5 Reproducibility

A Service Result expected to be reproducible must identify the States, State Heads, Projection definition, rules, criteria, and external source versions required to reproduce it.

The same effective inputs evaluated under the same rules must not produce materially different results without an identified source of nondeterminism.

Material nondeterminism must remain visible.

#### 4.6 Technology independence

Service responsibilities and results must remain independent of programming language, framework, database, cloud provider, repository provider, continuous-integration provider, AI provider, model family, deployment platform, and user-interface technology.

Tool-specific behavior belongs behind the Integration boundary or in implementation-specific clients.

#### 4.7 Simple defaults

A conforming implementation may provide simple default ownership, policy, Assurance, Projection, or integration behavior.

A default must not:

- weaken Kernel invariants;
- erase required distinctions;
- suppress Branches;
- convert uncertainty into certainty;
- create implicit Authority;
- bypass Change Control;
- make an implementation-specific convention normative.

### 5. Kernel access model

| Service | System | State and lineage | Change | Kernel mutation |
|---|---|---|---|---|
| Governance Service | Read | Read States, addresses, heads, Branches, and Projections | Read | Prohibited |
| Change Control Service | Read; request establishment | Read; propose output States and predecessor relationships | Read; request commitment | Permitted only through Kernel-defined operations |
| Assurance Service | Read | Read States, lineage, heads, Branches, and Projections | Read | Prohibited |
| Context and Projection Service | Read | Read States, lineage, heads, and Branches | Read | Prohibited |
| Integration Service | Read | Read States and mappings required for integration | Read | Prohibited |

The phrase `request commitment` does not allow Change Control to bypass the Kernel.

The Kernel independently verifies every invariant and commits all declared effects atomically.

A Service may retain operational data outside the Kernel.

Operational data must remain distinguishable from Kernel State and governed Projections.

### 6. Service Result classification

A Service Result must be distinguishable as either:

- Ephemeral Service Result; or
- Durable Service Result.

An Ephemeral Service Result may support active work.

It must not be represented as durable accepted understanding.

A Durable Service Result that changes represented Engineering State must be preserved through the canonical update path.

Examples that may require durable representation include:

- a Governance evaluation relied upon for a decision;
- an Assurance conclusion relied upon for a decision;
- a Branch-selection or merge decision;
- the rationale and disposition of a significant Engineering Change;
- an external observation that changes accepted understanding;
- a versioned Projection definition required for reproducibility.

This document does not determine when a particular result must become durable.

That determination belongs to later protocols and policy specifications.

### 7. Governance Service

#### 7.1 Purpose

The Governance Service determines which ownership, Authority, constraints, delegation, exception, escalation, and selection conditions apply to an Engineering Change or governed condition.

It answers:

> Under the applicable governed information, what conditions must be satisfied before an action, selection, resolution, or Change may proceed?

The Governance Service consolidates those responsibilities because they participate in one governing determination.

#### 7.2 Responsibilities

The Governance Service owns:

- ownership resolution;
- Authority resolution;
- constraint and policy applicability;
- delegation interpretation;
- required approval categories;
- exception and escalation requirements;
- governing conditions for Branch selection or merge;
- identification of unresolved Governance conditions;
- production of Governance Service Results.

The Governance Service must distinguish among satisfied, unsatisfied, conditional, and unresolved conditions.

The exact outcome vocabulary belongs to `42-review-and-governance.md`.

#### 7.3 Kernel information read

The Governance Service may read:

- System Identity;
- relevant States and State Addresses;
- State Lineage and State Heads;
- relevant Branches;
- relevant Changes;
- named Projections;
- State Content describing ownership, Authority, constraints, delegation, policy, and relationships.

It may also consider Ephemeral Service Results and externally sourced information supplied through Integration.

Those inputs must remain distinguishable from Kernel State and governed conclusions.

#### 7.4 Kernel information written

The Governance Service has no direct Kernel write authority.

It may:

- emit a Governance Service Result;
- propose State Content representing Governance information;
- recommend selection, rejection, or merge conditions;
- request preservation of a Governance Service Result;
- submit outputs to Change Control.

Only Change Control may coordinate their incorporation into State through Change.

#### 7.5 Required outputs

A Governance Service Result must identify, where applicable:

- the subject evaluated;
- the applicable scope and State Addresses;
- the evaluated Actor or source;
- applicable ownership and Authority;
- applicable constraints;
- required approvals or decision roles;
- exception or escalation handling;
- selection or merge conditions;
- unresolved conditions;
- provenance to governing sources;
- the evaluation basis, including relevant States or Projection.

#### 7.6 Required invariants

Every Governance Service Result must be scoped.

The Governance Service must not assume Authority or ownership solely because:

- no conflicting owner was found;
- no explicit prohibition was found;
- an external system granted permission;
- an Actor performed a similar action previously;
- a repository role has a particular name;
- an AI Agent asserted authorization.

Unknown Authority must not be treated as permission.

Absence of a discovered constraint must not be treated as proof that no constraint applies.

A later Governance change must not retroactively alter the meaning of a prior result.

The Governance Service may determine that a decision is required.

It must not manufacture the decision.

#### 7.7 Explicit non-ownership

The Governance Service does not own:

- Kernel structure;
- Engineering Change lifecycle coordination;
- final Engineering Change disposition;
- implementation or deployment execution;
- Assurance evaluation;
- Evidence production;
- Projection generation;
- external synchronization;
- user-facing workflow.

Governance determines governing conditions.

It does not determine whether an implementation works.

### 8. Change Control Service

#### 8.1 Purpose

The Change Control Service is the canonical coordinator for durable Atlas OS transitions.

It owns the Service-layer transaction boundary around an Engineering Change.

It coordinates information required to request:

- establishment of one or more Systems and Origin States through an indivisible Kernel operation;
- a Kernel Change creating one or more States;
- an atomic multi-address or multi-System Change;
- a Merge Change resolving one or more Branches;
- multiple causally related Changes when one atomic Change is not appropriate.

It answers:

> What durable transition is being attempted, what information governs it, and what Kernel result or non-commit disposition represents it?

The Kernel remains the authority for structural commitment.

#### 8.2 Responsibilities

The Change Control Service owns:

- registration and identification of an Engineering Change;
- association of the Engineering Change with affected Systems and State Addresses;
- identification of relevant input States, State Heads, and Branches;
- coordination of proposed output State Content and predecessor relationships;
- coordination of Governance and Assurance Service Results;
- preservation of decisions and rationale;
- coordination of Branch selection, rejection, or merge behavior;
- coordination of final disposition;
- detection of changed or competing lineage since evaluation;
- request of indivisible System establishment and, when applicable, Origin Change commitment;
- request of Kernel Change commitment;
- durable linking of resulting Changes to Service Results;
- preservation of rejected, abandoned, or superseded work where required;
- retry coordination without duplicate semantic Changes.

The exact lifecycle, ordering, and admission conditions belong to `40-change-protocol.md` and `41-change-lifecycle.md`.

#### 8.3 Kernel information read

The Change Control Service may read:

- Systems;
- States and State Addresses;
- State Lineage and State Heads;
- Branches;
- prior Changes;
- named Projections.

It may also consume Governance Results, Assurance Results, external observations, Actor-provided intent and rationale, and proposed State Content.

#### 8.4 Kernel operations requested

The Change Control Service is the sole Service permitted to request:

- indivisible establishment of Systems and Origin States;
- commitment of an Origin Change when the Kernel represents establishment through Change;
- commitment of a Change;
- creation of all declared output States;
- atomic effects across multiple State Addresses or Systems;
- commitment of a Merge Change.

Change Control must not:

- mutate an existing State;
- alter a committed Change;
- bypass Kernel validation;
- omit an affected System;
- hide a competing successor;
- treat a retry as a new semantic Change;
- claim atomicity with an external system unless a later protocol supplies it.

A multi-System Change is valid when every affected System and State is explicit and the Kernel commits all declared structural effects atomically.

A higher-level Engineering Change may instead coordinate several Changes when independent sequencing, partial outcomes, or external effects require it.

#### 8.5 Required outputs

The Change Control Service must preserve or make available, where applicable:

- an Engineering Change identity;
- affected Systems and State Addresses;
- input State identities;
- relevant State Heads and Branches;
- proposed output information;
- associated Governance and Assurance Results;
- decisions and rationale;
- requested atomicity boundary;
- final disposition;
- resulting Kernel Change identities;
- output State identities;
- unresolved conflict, partial outcome, or failure information;
- provenance linking the transition to its inputs.

#### 8.6 Required invariants

Every durable represented update initiated through the Service layer must pass through Change Control.

Change Control must not fabricate Governance, Assurance, Authority, or Kernel results.

A missing required result must not be treated as satisfied.

A rejected, abandoned, or superseded Engineering Change must not be misrepresented as committed.

Concurrent work must remain visible.

A changed lineage may require rejection, explicit Branch creation, reevaluation, or merge according to later protocol; it must not cause silent overwrite.

A retry must not create duplicate authoritative Kernel Changes for one successful semantic transition.

Restoration of prior content must create new State through a new Change.

A record claiming commitment must identify the corresponding Kernel Change and output States.

#### 8.7 Explicit non-ownership

The Change Control Service does not own:

- Kernel invariants;
- Authority semantics;
- Governance interpretation;
- Assurance criteria;
- Evidence generation;
- implementation or deployment execution;
- AI-agent orchestration;
- external source mapping;
- Projection-selection policy;
- user-facing interaction design;
- arbitrary business-process workflow.

Change Control coordinates Results without becoming their semantic owner.

### 9. Assurance Service

#### 9.1 Purpose

The Assurance Service evaluates whether assertions relied upon for an Engineering Change, State selection, Merge Change, or Software System condition are supported by sufficient identified information.

It distinguishes desired outcomes, evaluated assertions, supporting or contradicting information, and justified conclusions.

#### 9.2 Responsibilities

The Assurance Service owns:

- identification of assertions requiring evaluation;
- identification of required supporting information;
- association of supporting and contradicting information;
- evaluation of sufficiency under applicable criteria;
- production of scoped Assurance Results;
- identification of missing information and unresolved risk;
- preservation of conflicting information;
- provenance of Assurance inputs and results.

The complete model belongs to `43-validation-and-assurance.md`.

#### 9.3 Kernel information read

The Assurance Service may read:

- Systems;
- relevant States and State Addresses;
- State Heads and Branches;
- relevant State Lineage and Changes;
- named Projections;
- State Content concerning intended behavior, constraints, prior Assurance, or accepted conditions.

It may also consume proposed State Content, Governance Results, external observations, tests, reviews, measurements, and attestations.

#### 9.4 Kernel information written

The Assurance Service has no direct Kernel write authority.

It may emit an Assurance Result, propose State Content, request preservation of supporting information, and submit outputs to Change Control.

#### 9.5 Required outputs

An Assurance Result must identify, where applicable:

- the subject and assertion evaluated;
- the applicable scope and State Addresses;
- the States, State Heads, Branches, or Projection evaluated;
- criteria applied;
- supporting information;
- contradicting information;
- missing information;
- conclusion;
- unresolved risk or uncertainty;
- provenance and freshness.

#### 9.6 Required invariants

Every Assurance conclusion must be scoped.

A positive conclusion must identify supporting information.

Missing required information must not be interpreted as success.

Mutable external information relied upon durably must remain identifiable by immutable version, identity, digest, or equivalent mechanism.

Information used for one Engineering Change, Branch, or Projection must not automatically be treated as valid for another.

Conflicting information must remain visible.

An AI Agent assertion must not be treated as proof solely because it was produced by an AI Agent.

The Assurance Service must not define its own acceptance Authority.

#### 9.7 Explicit non-ownership

The Assurance Service does not own permission to proceed, organizational Authority, Governance rules, final disposition, lifecycle progression, Change commitment, external synchronization, Projection selection, or user-facing interaction design.

An Engineering Change may be sufficiently assured but unauthorized.

It may be authorized but insufficiently assured.

### 10. Context and Projection Service

#### 10.1 Purpose

The Context and Projection Service transforms Kernel primitives and relevant Service Results into usable purpose-specific views.

It exists because an Actor should not be required to inspect every State lineage, Branch, Change, and Service Result to perform a bounded responsibility.

It owns assembly of the smallest sufficient relevant view while preserving provenance, uncertainty, source status, and selection criteria.

#### 10.2 Responsibilities

The Context and Projection Service owns:

- named Projection production;
- State Head selection according to supplied rules and Governance Results;
- purpose-specific information selection;
- current implementation, production reality, accepted architecture, intended architecture, and other currentness views;
- relevant history and Change trace views;
- audit and drift views;
- system maps;
- ownership, constraint, decision, and Assurance summaries;
- Branch and uncertainty presentation;
- bounded context-size management;
- provenance-preserving summarization;
- reproducibility of versioned Projection definitions.

Audit and knowledge views are derived from Kernel structure and Service Results.

They are not independent authoritative histories.

#### 10.3 Kernel information read

The Context and Projection Service may read:

- Systems;
- States and State Addresses;
- State Lineage and State Heads;
- Branches;
- Changes;
- Durable Service Results represented in State Content;
- permitted Ephemeral Service Results;
- versioned Projection definitions;
- source mappings supplied by Integration.

#### 10.4 Kernel information written

The Context and Projection Service has no direct Kernel write authority.

Ordinary Projection generation produces no Kernel write.

A Projection definition or derived result may become durable only when later policy requires it and Change Control coordinates its representation through State and Change.

A cache or materialized view must not be treated as canonical Kernel structure solely because it is stored durably.

#### 10.5 Required outputs

A Projection must identify, where applicable:

- its purpose;
- its target Actor or Actor class;
- included Systems and Engineering Changes;
- source State Addresses;
- selected States or State Heads;
- relevant Branches;
- selection and exclusion criteria;
- Governance or Assurance Results used;
- derived or summarized elements;
- unresolved conflict or uncertainty;
- provenance and freshness;
- the Projection definition or version when reproducibility is required.

#### 10.6 Required invariants

Every projected element must retain provenance to its source.

Derived information must remain distinguishable from Kernel State and from owning Service Results.

A Projection must not:

- become a fourth Kernel primitive;
- replace the underlying graph;
- silently discard a Branch;
- represent a State Head as selected without applicable criteria;
- conceal material disagreement among projections;
- alter source meaning through summarization.

A reproducible Projection evaluated against the same source graph and definition must produce the same effective result, except for identified nondeterminism.

Projection freshness and source lineage boundaries must remain identifiable.

The Service must optimize for minimum sufficient information rather than maximum retrieval.

#### 10.7 Explicit non-ownership

The Context and Projection Service does not own Kernel truth, Governance policy, Authority, Assurance conclusions, Change commitment, external synchronization, final disposition, or user-interface visual design.

A Projection may expose or apply an explicit governed selection.

It may not manufacture the governing decision.

### 11. Integration Service

#### 11.1 Purpose

The Integration Service connects Atlas OS to external engineering systems.

It normalizes external events, artifacts, observations, identities, and actions without allowing external systems to redefine Atlas OS semantics.

#### 11.2 Responsibilities

The Integration Service owns:

- external-system identification;
- mapping between external references and Atlas OS subjects;
- normalization of external events and artifacts;
- provenance capture;
- immutable source-version identification;
- idempotent ingestion;
- synchronization status and failure visibility;
- Adapter health reporting;
- production of external observations;
- submission of potential Assurance or Engineering Change inputs;
- execution of authorized outbound actions;
- recording of outbound results.

#### 11.3 Kernel information read

The Integration Service may read Systems, States, State Addresses, relevant lineage, Changes, Projections, Adapter configuration, authorized outbound requests, and source mappings.

#### 11.4 Kernel information written

The Integration Service has no direct Kernel write authority.

It may emit normalized observations, mappings, synchronization information, candidate Assurance inputs, candidate Engineering Change inputs, and outbound-action results.

Those outputs become represented State only through Change Control and a Kernel Change.

#### 11.5 Required outputs

An Integration Result must identify, where applicable:

- the external system;
- source event or artifact;
- external identity;
- immutable source version, digest, or equivalent identity;
- source-reported and Atlas-observed times;
- associated System, State Address, or Engineering Change when known;
- normalization performed;
- Adapter or integration path;
- synchronization status;
- unresolved mapping;
- provenance;
- outbound authorization and result.

#### 11.6 Required invariants

Every imported observation must identify its source.

A mutable source relied upon durably must be captured by immutable version, identity, digest, or equivalent mechanism.

Repeated ingestion of the same semantic event must not create duplicate meaning or duplicate Changes.

Observed external information must remain distinguishable from Kernel State, proposed State Content, Governance Results, Assurance Results, and named Projections.

External deletion must not silently erase Atlas OS history already represented through State and Change.

Synchronization failure must remain visible.

External identity must not automatically become System Identity, Scope Reference, or Facet Reference.

Outbound external mutation requires explicit authorization supplied through applicable Services and protocols.

External timestamp order must not override Kernel lineage.

#### 11.7 Explicit non-ownership

The Integration Service does not own Kernel structure, Software System boundary decisions, Governance interpretation, Authority decisions, Assurance conclusions, final disposition, repository architecture, user-facing interaction design, or domain meaning of imported content.

An external event does not independently establish authorization, correctness, acceptance, or Kernel commitment.

### 12. Inter-Service ownership

Each mandatory responsibility has one canonical owner.

Services may depend on one another's Results.

Dependency must not transfer ownership.

#### 12.1 Governance and Change Control

Governance determines applicable governing and selection conditions.

Change Control coordinates an Engineering Change using the Governance Result.

Change Control must not reinterpret Governance rules.

Governance must not commit the Change.

#### 12.2 Assurance and Change Control

Assurance evaluates assertions and supporting information.

Change Control coordinates the Engineering Change using the Assurance Result.

Change Control must not fabricate or reinterpret an Assurance conclusion.

Assurance must not commit or authorize the Change.

#### 12.3 Context and other Services

The Context and Projection Service may provide purpose-specific views to Actors and Services.

A Projection must preserve the ownership, scope, and provenance of Governance, Assurance, Integration, and Change Control Results.

A Projection may apply explicit selection rules.

It must not become the source of those rules.

#### 12.4 Integration and other Services

Integration supplies normalized observations and authorized external actions.

Governance determines governing conditions.

Assurance determines what external information supports an assertion.

Change Control determines whether an observation participates in a Change.

Context determines how the observation is presented.

Integration must not assume those responsibilities.

#### 12.5 Change Control and Kernel

Change Control coordinates a requested transition.

The Kernel enforces:

- identity;
- State ownership and Address structure;
- input existence;
- output uniqueness;
- predecessor relationships;
- lineage acyclicity;
- Branch preservation;
- atomic application;
- explicit affected-System membership;
- all other Kernel invariants.

Service-level approval cannot override a Kernel failure.

Kernel structural validity does not imply semantic approval.

### 13. Structural integrity and Semantic Integrity

Kernel structural integrity concerns whether:

- System, State, and Change identities are valid;
- State ownership and State Addresses are valid;
- input and output relationships are explicit;
- lineage is acyclic;
- Branches remain visible;
- all declared Change effects commit atomically;
- cross-System effects are explicit.

Semantic Integrity concerns whether:

- governing conditions are correctly scoped;
- State Head selection is explicit and justified;
- decisions remain linked to their basis;
- Assurance conclusions remain linked to supporting information;
- Projections preserve provenance and uncertainty;
- external observations remain distinguishable from Kernel State;
- Service ownership remains unambiguous.

A structurally valid Change may be semantically invalid.

A semantically supported proposal may fail structural commitment.

No Service Result may override a Kernel invariant.

### 14. Services deliberately not created

#### 14.1 No separate Audit Service

Audit is a Projection over Kernel structure and relevant Service Results.

A separate authoritative Audit Service would create a second history capable of diverging from the Kernel graph.

#### 14.2 No separate Decision Service

Change Control owns durable association of decisions and rationale with Engineering Changes.

Governance determines which Authority or approvals are required.

A separate Decision Service would divide those responsibilities unnecessarily.

#### 14.3 No separate Knowledge Service

Knowledge-oriented views are Projections assembled from State, Change history, decisions, constraints, Assurance information, and external provenance.

A separate authoritative knowledge store would risk becoming an unauthoritative duplicate.

#### 14.4 No general-purpose Workflow Service

Atlas OS requires a bounded Engineering Change protocol, not an arbitrary workflow-automation platform.

Organization-specific orchestration may exist above Atlas OS.

#### 14.5 No AI Agent Service

AI Agents are Actors and clients of Atlas OS.

Model routing, prompt frameworks, autonomous coding execution, and provider-specific orchestration belong in clients, adapters, or external systems.

#### 14.6 No Repository Service

Repositories are external representations and Instantiation Surfaces.

Repository interaction belongs to Integration.

Repository-derived views may be produced by Context and Projection.

#### 14.7 No separate Policy Service

Constraint and policy applicability belong to Governance.

A policy engine may exist as an internal module without acquiring separate canonical ownership.

#### 14.8 No separate Evidence Service

Evaluation and association of supporting information belong to Assurance.

External collection may occur through Integration, and persistence through later storage mechanisms.

### 15. Service conformance

An Atlas OS implementation conforms to this Service Architecture only when:

1. all five mandatory Logical Services are present;
2. each mandatory responsibility has one canonical owner;
3. physical topology does not alter logical ownership;
4. only Change Control requests Kernel Changes;
5. the Kernel independently enforces structural invariants;
6. no Service mutates State or Change;
7. no Service hides Branches or invents implicit currentness;
8. Service Results preserve provenance and uncertainty;
9. Ephemeral and Durable Service Results remain distinguishable;
10. Projections remain derived from and traceable to Kernel structure;
11. external observations remain distinguishable from Kernel State;
12. Governance and Assurance remain distinct;
13. no prohibited additional mandatory Service acquires duplicate ownership;
14. tool-specific and AI-provider-specific semantics remain outside mandatory Service boundaries.

## Requirements

**Document Prefix:** `SVC`

### Service model

**SVC-001**  
Atlas OS MUST define exactly five mandatory Logical Services: Governance Service, Change Control Service, Assurance Service, Context and Projection Service, and Integration Service.

**SVC-002**  
All five mandatory Service boundaries MUST be present in a conforming Atlas OS architecture.

**SVC-003**  
Service boundaries MUST be treated as logical responsibility boundaries rather than required deployment boundaries.

**SVC-004**  
An implementation MAY co-locate or distribute Services provided that canonical ownership remains unchanged.

**SVC-005**  
Every mandatory Service responsibility MUST have exactly one canonical Service owner.

**SVC-006**  
A Service MUST NOT transfer its canonical responsibility to another Service through implementation topology.

**SVC-007**  
A new mandatory Service MUST NOT be introduced unless its responsibility cannot be assigned to an existing Service without violating ownership clarity or an applicable invariant.

### Kernel boundary

**SVC-008**  
A Service MUST preserve the canonical meanings and invariants of System, State, and Change.

**SVC-009**  
A Service MUST NOT mutate an existing State.

**SVC-010**  
A Service MUST NOT rewrite a committed Change.

**SVC-012**  
A Service MUST NOT reuse a Kernel identity.

**SVC-013**  
A Service MUST NOT bypass Kernel invariant enforcement.

**SVC-014**  
No Service other than the Change Control Service MAY request establishment of a System or commitment of a Kernel Change.

**SVC-015**  
The Change Control Service MUST NOT commit a structural transition independently of the Kernel.

**SVC-016**  
The Kernel MUST independently validate every transition requested by the Change Control Service.

### Service Results

**SVC-017**  
A Service Result MUST remain distinguishable as ephemeral or durable.

**SVC-018**  
A Service Result MUST NOT become Kernel State or governed current understanding solely because a Service produced or stored it.

**SVC-019**  
A Durable Service Result that changes represented Engineering State MUST become durable through Change Control and a Kernel Change creating new State.

**SVC-020**  
A Service Result affecting an Engineering Change MUST preserve provenance to its source inputs, applicable State Addresses, and evaluation basis.

**SVC-021**  
A Service MUST preserve relevant uncertainty, disagreement, incompleteness, and conflicting information.

**SVC-022**  
A Service MUST NOT silently convert missing or unknown information into a satisfied result.

**SVC-023**  
A Service MUST NOT silently promote an inference, Projection, or external observation into Kernel State or governed acceptance.

### Governance Service

**SVC-024**  
The Governance Service MUST own ownership resolution.

**SVC-025**  
The Governance Service MUST own Authority resolution.

**SVC-026**  
The Governance Service MUST own evaluation of applicable constraints and policy.

**SVC-027**  
The Governance Service MUST own interpretation of delegation, exception, escalation, and governed selection requirements.

**SVC-028**  
Every Governance Service Result MUST identify its applicable scope and governing sources.

**SVC-029**  
Unknown Authority MUST NOT be treated as permission.

**SVC-030**  
Absence of a discovered constraint MUST NOT be treated as proof that no constraint applies.

**SVC-031**  
External identity or permission data MUST NOT independently establish Atlas OS Authority.

**SVC-032**  
The Governance Service MUST NOT commit a Kernel Change.

**SVC-033**  
The Governance Service MUST NOT determine whether an implementation is technically correct.

### Change Control Service

**SVC-034**  
The Change Control Service MUST be the canonical coordinator for durable Atlas OS transitions.

**SVC-035**  
Every durable represented State update initiated through the Service layer MUST be coordinated by the Change Control Service.

**SVC-036**  
The Change Control Service MUST coordinate association of an Engineering Change with affected Systems, State Addresses, and relevant input States.

**SVC-037**  
The Change Control Service MUST coordinate Governance and Assurance Service Results required by later protocol or policy.

**SVC-038**  
The Change Control Service MUST preserve the association among an Engineering Change, its decisions, rationale, resulting Kernel Changes, and output States.

**SVC-039**  
The Change Control Service MUST NOT fabricate a Governance Service Result.

**SVC-040**  
The Change Control Service MUST NOT fabricate an Assurance Service Result.

**SVC-041**  
The Change Control Service MUST NOT treat a missing required Service Result as satisfied.

**SVC-043**  
A retry coordinated by Change Control MUST NOT create duplicate authoritative Kernel Changes for one successful semantic transition.

**SVC-044**  
A restoration of prior State Content MUST be coordinated as new State through a new Kernel Change.

**SVC-046**  
The Change Control Service MUST NOT become a general-purpose workflow engine.

### Assurance Service

**SVC-047**  
The Assurance Service MUST own evaluation of whether assertions are supported by identified information.

**SVC-048**  
An Assurance Service Result MUST identify the condition evaluated and the applicable scope.

**SVC-049**  
A positive Assurance conclusion MUST identify supporting information.

**SVC-050**  
Missing required supporting information MUST NOT be interpreted as success.

**SVC-051**  
Supporting and contradicting information MUST preserve provenance.

**SVC-052**  
Conflicting Assurance information MUST remain visible.

**SVC-053**  
Information used for one Engineering Change, Branch, or Projection MUST NOT automatically be treated as sufficient for another.

**SVC-054**  
An AI Agent assertion MUST NOT be treated as proof solely because it was produced by an AI Agent.

**SVC-055**  
The Assurance Service MUST NOT authorize an Engineering Change.

**SVC-056**  
The Assurance Service MUST NOT determine final Engineering Change disposition.

### Context and Projection Service

**SVC-057**  
The Context and Projection Service MUST own purpose-specific Projection generation.

**SVC-058**  
Every Projection element MUST retain provenance to its source.

**SVC-059**  
A Projection MUST remain distinguishable from canonical Kernel State and Change structure.

**SVC-061**  
A Projection MUST NOT silently resolve conflicting States, Branches, observations, or interpretations.

**SVC-062**  
A Projection MUST expose uncertainty that materially affects its defined purpose.

**SVC-063**  
Summarization MUST NOT change the meaning of source information.

**SVC-064**  
Projection freshness and source-lineage boundaries MUST remain identifiable.

**SVC-065**  
Audit views MUST derive from Kernel structure and relevant Service Results.

**SVC-066**  
Atlas OS MUST NOT maintain a separate authoritative audit history capable of diverging from Kernel lineage.

**SVC-067**  
The Context and Projection Service MUST optimize for minimum sufficient information rather than maximum retrieval.

**SVC-068**  
The Context and Projection Service MUST NOT determine Authority, Assurance, or Change commitment.

### Integration Service

**SVC-069**  
The Integration Service MUST own normalization of external engineering events, artifacts, observations, and actions.

**SVC-070**  
Every imported external observation MUST identify its source.

**SVC-071**  
Mutable external information relied upon durably MUST be identified by an immutable version, identity, digest, or equivalent mechanism.

**SVC-072**  
Integration ingestion MUST be idempotent with respect to the same external semantic event.

**SVC-074**  
External deletion MUST NOT silently erase Atlas OS history represented through State and Change.

**SVC-075**  
Synchronization failure MUST remain visible.

**SVC-076**  
External tool identity MUST NOT automatically become System Identity, Scope Reference, or Facet Reference.

**SVC-077**  
Outbound external mutation MUST require explicit authorization supplied through applicable Atlas OS Services and protocols.

**SVC-078**  
An Adapter MUST NOT silently reinterpret external information as a different Atlas OS concept.

**SVC-079**  
External timestamp order MUST NOT override Kernel State Lineage.

**SVC-080**  
The Integration Service MUST NOT infer solely from an external event that an Engineering Change was authorized, assured, accepted, or committed.

### Service separation

**SVC-081**  
Governance Service Results and Assurance Service Results MUST remain semantically distinct.

**SVC-082**  
A Governance Service Result MUST NOT be treated as proof of technical correctness.

**SVC-083**  
An Assurance Service Result MUST NOT be treated as Authority to proceed.

**SVC-084**  
A Projection MUST NOT become the canonical source of Governance, Assurance, or underlying Kernel structure.

**SVC-085**  
An Integration Service Result MUST NOT become represented State without Change Control and a Kernel Change.

**SVC-086**  
A structurally valid Kernel Change MUST NOT be treated as proof of Semantic Integrity.

**SVC-087**  
A semantically supported Engineering Change MUST NOT override a Kernel structural failure.

### Services not created

**SVC-088**  
Atlas OS MUST NOT define a separate mandatory Audit Service.

**SVC-089**  
Atlas OS MUST NOT define a separate mandatory Decision Service.

**SVC-090**  
Atlas OS MUST NOT define a separate mandatory Knowledge Service.

**SVC-091**  
Atlas OS MUST NOT define a mandatory general-purpose Workflow Service.

**SVC-092**  
Atlas OS MUST NOT define a mandatory AI Agent Service.

**SVC-093**  
Atlas OS MUST NOT define a mandatory Repository Service.

**SVC-094**  
Atlas OS MUST NOT define a separate mandatory Policy Service.

**SVC-095**  
Atlas OS MUST NOT define a separate mandatory Evidence Service.

### Technology independence

**SVC-096**  
Mandatory Service responsibilities MUST remain independent of programming language, framework, database, cloud provider, repository provider, AI provider, and deployment platform.

**SVC-097**  
Tool-specific behavior MUST remain behind the Integration boundary or within implementation-specific clients.

**SVC-098**  
AI-provider-specific behavior MUST NOT become part of a mandatory Service responsibility.

**SVC-099**  
Simple defaults MAY be provided but MUST NOT weaken Kernel invariants, erase required distinctions, create implicit Authority, suppress Branches, or bypass Change Control.

### Scoped State, Branch, and Projection alignment

**SVC-100**  
Every Service MUST preserve the Kernel definition of State as an immutable scoped assertion at one State Address.

**SVC-101**  
A Service MUST NOT redefine State as a monolithic whole-System snapshot.

**SVC-102**  
A Service MUST NOT treat a State Head as inherently current, accepted, authoritative, or semantically preferred.

**SVC-103**  
A Service MUST preserve every material Branch and MUST NOT silently discard a competing successor State.

**SVC-104**  
Named currentness views MUST be produced as Projections over identified States or State Heads.

**SVC-105**  
A Projection MUST identify its selection criteria, selected States or State Heads, relevant Branches, and source provenance.

**SVC-106**  
A governed Branch selection, rejection, or merge MUST remain explicit and attributable to the responsible Governance, Assurance, and Change Control Results.

### Multi-address and multi-System Change

**SVC-107**  
The Change Control Service MAY request one Kernel Change that atomically affects multiple State Addresses or Systems.

**SVC-108**  
A multi-System Change requested by Change Control MUST enumerate every affected System, input State, output State, and predecessor relationship.

**SVC-109**  
Change Control MUST distinguish one atomic multi-System Change from an Engineering Change coordinated through multiple independent Kernel Changes.

**SVC-110**  
A changed lineage discovered before commitment MUST result in explicit rejection, reevaluation, Branch creation, or merge handling rather than silent overwrite.

### Integration and State status

**SVC-111**  
An external observation MUST remain distinguishable from Kernel State, proposed State Content, governed Service Results, and named Projections.

**SVC-112**  
No Service composition MAY bypass Change Control, Kernel atomicity, Branch preservation, or explicit cross-System effects.

### Retired requirement identifiers

The following Version 0.1 Requirement Identifiers are retired because they encoded the rejected monolithic-current-State or single-System-Change model:

| Retired identifier | Replacement |
|---|---|
| `SVC-011` | `SVC-100` through `SVC-106` |
| `SVC-042` | `SVC-110` |
| `SVC-045` | `SVC-107` through `SVC-109` |
| `SVC-060` | `SVC-104`, `SVC-105` |
| `SVC-073` | `SVC-111` |

Retired identifiers must not be reused.

## Non-goals

This document does not define:

1. Kernel primitives or Kernel persistence.
2. Scope Reference or Facet Reference vocabularies.
3. State Content schemas.
4. Named Projection definitions.
5. Projection-selection algorithms.
6. Branch-resolution protocol.
7. Engineering Change admission criteria.
8. Engineering Change lifecycle states.
9. Protocol ordering.
10. Retry or timeout protocol.
11. Governance rule syntax.
12. Authority hierarchy.
13. Authorization protocol.
14. Engineering Review gates.
15. Assurance Claim or Evidence schemas.
16. Assurance verdict vocabulary.
17. Context-package schemas.
18. Workspace behavior.
19. Adapter interfaces.
20. Integration transport.
21. API resources or operations.
22. Storage technology or physical schemas.
23. Retention or deletion policy.
24. Security controls or Trust policy.
25. Failure recovery.
26. Performance or availability requirements.
27. Deployment, process, repository, or team boundaries.
28. Programming language or framework selection.
29. AI-model routing or prompt construction.
30. Autonomous agent execution.
31. General-purpose project management or workflow automation.

## Open Questions

### OQ-1: Durable preservation of uncommitted Engineering Changes

The Mission requires preservation of rejected, abandoned, superseded, or otherwise uncompleted Engineering Changes when their decisions or rationale affect future work.

Change Control owns coordination of that preservation.

The representation may involve State Content, a durable non-Kernel protocol record, or another persistence mechanism defined later.

This question belongs to `40-change-protocol.md`, `41-change-lifecycle.md`, and `60-storage-and-persistence.md`.

### OQ-2: Multi-System coordination beyond one Change

The Kernel permits one Change to affect multiple Systems atomically.

A higher-level Engineering Change may nevertheless require multiple Kernel Changes because of external side effects, independent authorization, staged execution, or partial-success semantics.

Later protocol and failure specifications must define coordinated admission, ordering, compensation, and partial outcomes without weakening Kernel atomicity inside any one Change.

## Future Considerations

Future versions may evaluate:

1. federated Governance deployments;
2. cross-organization Authority resolution;
3. richer Assurance methods;
4. formal verification integration;
5. advanced Projection languages;
6. predictive risk Projections;
7. additional external-system adapters;
8. distributed coordination across multiple Kernel Changes;
9. cryptographic provenance;
10. materialized Projection optimization.

A Future Consideration must not create a sixth mandatory Service unless the amendment criteria in this document and `00-specification-governance.md` are satisfied.
