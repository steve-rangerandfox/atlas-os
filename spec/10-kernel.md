# Atlas OS Kernel

**Status:** Draft  
**Version:** 0.2

## Purpose

This document defines the Atlas OS Kernel.

The Kernel is the smallest implementation-independent structural model required to preserve coherent Software System Evolution.

It defines:

- the three irreducible Kernel primitives;
- the identity and ownership rules for those primitives;
- the structural address of State;
- the lineage relationships created by Change;
- atomicity and concurrency guarantees;
- the treatment of branching and merging;
- the relationship between Kernel structure and higher-level semantic policy;
- the structural guarantees every conforming implementation must preserve.

The Kernel contains exactly three primitive types:

1. System
2. State
3. Change

The Kernel does not define Governance, Assurance, Context, Workspace, interaction behavior, protocol ordering, APIs, persistence technology, or implementation topology.

The Kernel preserves structural integrity.

Higher-level services and protocols preserve semantic integrity and determine how Kernel structure is interpreted, governed, selected, validated, and presented.

## Dependencies

This document normatively depends on:

1. `01-atlas-mission.md`, Version 0.2 Draft.
2. `02-terminology.md`, Version 0.3 Draft.
3. `05-design-principles.md`, Version 0.2 Draft.

This document is governed by:

- `00-specification-governance.md`, Version 0.1 Draft.

The Kernel architecture defined here treats State as an immutable scoped assertion, derives currentness through a derived projection, preserves concurrent successors, and permits a Change to affect multiple Systems atomically.

No additional Kernel primitive is introduced.

## Definitions

### Branch

A structural condition in which two or more States at the same State Address descend from the same predecessor State without one being a descendant of the other.

A Branch is visible Kernel structure.

It is not a fourth primitive and does not independently determine semantic conflict, acceptance, or currentness.

### Change

An identified, immutable, atomic record that creates one or more States from zero or more explicitly identified prior States.

A Change identifies:

- zero or more input States;
- one or more output States;
- every affected System;
- the structural predecessor relationships connecting its outputs to prior lineage.

A Change is a Kernel primitive.

### Change Identity

The stable identity assigned to one Change.

A Change Identity distinguishes that Change from every other Change within the applicable Atlas OS scope.

A Change Identity is not a separate Kernel primitive.

### Facet Reference

The opaque structural coordinate within a State Address that identifies the dimension of engineering information represented by a State.

Examples may include implementation, intended architecture, deployed version, ownership, or observed runtime behavior.

The Kernel compares Facet References for identity and equality but does not interpret their domain meaning.

A Facet Reference is not a Kernel primitive.

### Kernel

The implementation-independent structural model consisting of System, State, Change, and the relationships and invariants defined by this document.

### Merge Change

A Change that references two or more States from one or more Branches and creates one or more new States that explicitly preserve those predecessor relationships.

A Merge Change is a qualified use of Change.

It is not an additional Kernel primitive and does not imply semantic compatibility or approval.

### Origin Change

A Change with no input States that establishes one or more Origin States and may establish one or more new Systems.

An Origin Change is a qualified use of Change.

It is not an additional Kernel primitive.

### Origin State

The first State in one State lineage at one State Address.

An Origin State has no predecessor State at that State Address.

An Origin State may be produced by an Origin Change or established through the Kernel-defined System-establishment origin case.

`Origin State` is a qualified condition of State and is not an additional Kernel primitive.

### Scope Reference

The opaque structural coordinate within a State Address that identifies the part or subject area of a System to which a State applies.

The Kernel compares Scope References for identity and equality but does not interpret their domain meaning.

A Scope Reference is not a Kernel primitive.

### State

An identified, immutable, content-verifiable, scoped assertion about exactly one System at a specific point in lineage.

A State occupies exactly one State Address.

A State does not inherently mean complete truth, approved truth, current truth, accepted truth, or a whole-System snapshot.

A State is a Kernel primitive.

### State Address

The structural address occupied by a State.

A State Address is the tuple:

```text
System Identity + Scope Reference + Facet Reference
```

States at the same State Address participate in one or more related lineages for the same structural subject.

A State Address is not a Kernel primitive.

### State Content

The information represented directly or by immutable reference through a State.

State Content is not a Kernel primitive.

The Kernel preserves the identity, digest, and structural position of State Content but does not define its domain-specific meaning.

### State Head

A State at a particular State Address for which no later State at that same address identifies it as a predecessor.

A State Address has one or more State Heads whenever it contains State.

A State Head is not inherently current, accepted, authoritative, or semantically preferred.

`State Head` is a qualified structural condition of State and is not an additional Kernel primitive.

### State Identity

The stable identity assigned to one State.

A State Identity distinguishes that State from every other State within the applicable Atlas OS scope.

A State Identity is not a separate Kernel primitive.

### State Lineage

The acyclic structural relationships among States created by predecessor references recorded through Changes.

A State lineage is evaluated within one State Address when determining Branches and State Heads.

A Change may also record causal inputs across different State Addresses or Systems.

State Lineage is not a Kernel primitive.

### System

The identified Kernel representation of one Software System.

A System provides durable identity and a namespace for State while remaining independent of repositories, products, services, deployments, organizations, owners, tools, and other Instantiation Surfaces.

A System is a Kernel primitive.

### System Identity

The stable identity assigned to one System.

A System Identity distinguishes that System from every other System within the applicable Atlas OS scope.

A System Identity is not a separate Kernel primitive.

## Specification

### 1. Kernel authority

The Kernel defines the irreducible structural model through which Atlas OS preserves Software System identity, immutable engineering assertions, and explicit evolution.

The Kernel owns:

- System identity;
- State identity;
- Change identity;
- State Address structure;
- State ownership;
- Change inputs and outputs;
- State predecessor relationships;
- State Lineage;
- Branch visibility;
- atomic Change application;
- the structural invariants defined by this document.

The Kernel does not own:

- the domain meaning of Scope References or Facet References;
- whether a State is authoritative, accepted, current, valid, trusted, or preferred;
- whether States at different addresses are semantically compatible;
- whether a Branch should be selected, rejected, or merged;
- whether an Engineering Change should proceed;
- semantic policy, workflow, presentation, or implementation behavior.

Higher-level specifications may interpret, govern, validate, select, project, or present Kernel primitives.

They must not alter the canonical meanings or structural invariants defined here.

### 2. Minimal primitive set

The Atlas OS Kernel contains exactly three primitive types:

1. System
2. State
3. Change

The primitives have distinct responsibilities:

- System provides durable identity and a State namespace.
- State records an immutable scoped assertion at one State Address.
- Change records an immutable atomic structural transition that creates State.

System cannot be replaced by State because Software System identity must survive the creation and succession of individual assertions.

State cannot be replaced by Change because Atlas OS must represent the assertions that exist between Changes.

Change cannot be replaced by State because Atlas OS must preserve how assertions were created and related.

Scope Reference, Facet Reference, State Address, State Lineage, Branch, State Head, Origin Change, Origin State, and Merge Change are structural coordinates, relationships, or qualified conditions.

They do not expand the primitive set.

No fourth primitive may be added unless a future accepted revision demonstrates that required structural semantics cannot be represented through System, State, Change, or their relationships.

### 3. System semantics

A System is a durable identity for a Software System whose Engineering State evolves over time.

A System establishes:

- continuity;
- a namespace for State;
- a boundary across which relationships and effects must be explicit.

A System does not prescribe what kind of Software System it represents.

A System may correspond to a product, service, platform, library, infrastructure domain, bounded context, or composite engineering environment.

Those interpretations belong above the Kernel.

System identity must not be derived solely from:

- a repository URL;
- a product name;
- an organization;
- a team;
- a filesystem path;
- a deployment location;
- an external vendor identifier;
- mutable State Content.

A System must not contain mutable current engineering information as intrinsic System properties.

Ownership, composition, lifecycle status, criticality, dependencies, and other mutable characteristics are represented through State or higher-level service results.

### 4. Relationship between System and Software System

`Software System` is the mission-level subject whose coherent evolution Atlas OS governs.

`System` is the Kernel representation of one Software System.

The relationship is one-to-one within the applicable Atlas OS scope:

- one governed Software System is represented by one System;
- one System represents one Software System.

The Kernel does not decide where a Software System boundary should be drawn.

That decision belongs to higher-level governance and adoption policy.

A repository may contain multiple Systems.

A System may span multiple repositories.

A product may contain multiple Systems.

A repository, product, service, organization, or deployment is not automatically a System.

### 5. System Identity

Every System must have exactly one System Identity.

A System Identity must be:

- stable;
- unambiguous within the applicable Atlas OS scope;
- distinct from every other System Identity;
- independent of mutable labels and locations;
- never reused for a different System.

A System may be renamed, moved, split, merged, deprecated, superseded, or made inactive without silently rewriting its identity or history.

A System reference must resolve unambiguously within its applicable scope.

The Kernel does not prescribe identifier syntax, encoding, generation method, or storage representation.

### 6. State semantics

A State is an immutable scoped assertion about one System.

A State does not represent the complete engineering reality of that System.

A State asserts only that identified State Content existed:

- for one System;
- at one Scope Reference;
- for one Facet Reference;
- at one specific position in lineage.

A State may describe implementation, deployment, architecture, intent, ownership, validation, dependencies, runtime observation, or another engineering concern.

The Kernel does not interpret those meanings.

The existence of a State does not independently establish that its content is:

- true;
- accepted;
- approved;
- current;
- complete;
- valid;
- compatible;
- sufficiently evidenced;
- safe.

Those conclusions belong to higher-level services and protocols.

### 7. State Address

Every State must occupy exactly one State Address.

A State Address contains:

1. the owning System Identity;
2. one Scope Reference;
3. one Facet Reference.

The System coordinate establishes ownership.

The Scope Reference identifies the part or subject area within the System.

The Facet Reference identifies the engineering dimension represented.

Scope References and Facet References are mandatory opaque identifiers.

The Kernel determines only their identity and equality.

Higher-level specifications define their vocabulary, meaning, schema, governance, and compatibility rules.

States at different addresses may be semantically incompatible even though no structural collision exists.

The Kernel must not infer compatibility across State Addresses.

### 8. State Identity and ownership

Every State must have exactly one stable State Identity.

Every State belongs to exactly one System.

A State must not be jointly owned by multiple Systems or transferred between Systems.

A State may reference other Systems or States in its content or Change inputs.

Those references do not change ownership.

A State Identity must not be reused.

Two States with equivalent State Content remain distinct when they have distinct State Identities or lineage positions.

A State reference must identify or unambiguously resolve:

- the State;
- its owning System;
- its State Address.

### 9. State Content integrity

State Content may be represented:

- directly;
- through an immutable external reference;
- through a combination of direct and referenced information.

Every State must carry or resolve an integrity mechanism sufficient to prevent its meaning from changing silently.

That mechanism may include a content digest, immutable version identifier, content-addressed reference, or equivalent guarantee.

A mutable external pointer without an immutable version or digest is not sufficient State Content identity.

If externally maintained content changes, Atlas OS must represent the new meaning through a new State.

The Kernel does not require all externally maintained information to be physically copied into Atlas OS.

### 10. State immutability

A State is immutable after creation.

The following properties must not change:

- State Identity;
- owning System;
- Scope Reference;
- Facet Reference;
- State Content identity or digest;
- producing Change;
- predecessor relationships;
- lineage position.

A correction, replacement, restoration, supersession, or changed interpretation that alters the represented assertion requires a new State created through a new Change.

A new State may contain content equivalent to an earlier State.

It remains distinct because its identity, producing Change, and lineage context differ.

### 11. Origin States and System establishment

A State lineage begins with an Origin State.

An Origin State has no predecessor State at its State Address.

An Origin Change may:

- establish one or more new Systems;
- create one or more Origin States;
- create a new State Address within an existing System.

Creation of a new System and creation of at least one Origin State for that System must be structurally indivisible.

A System must not become valid Kernel structure without at least one traceable Origin State.

An implementation may represent the origin case through an Origin Change or through an equivalent indivisible Kernel establishment operation.

An Origin Change may affect multiple new or existing Systems when every affected System and output State is explicit.

### 12. State Lineage

State Lineage is established by predecessor relationships recorded through Change.

When a Change advances an existing State Address, each output State at that address must identify one or more predecessor States at that same address.

When a Change establishes a new State Address, the output State may have no predecessor at that address and becomes an Origin State for that lineage.

A Change may also identify input States from other addresses or Systems as causal dependencies.

State Lineage must be:

- traceable;
- acyclic;
- immutable;
- independent of timestamp ordering.

Timestamp metadata may describe observation or execution time.

It must not replace explicit causal relationships.

### 13. State Heads

A State Head is derived from State Lineage.

A State Address has:

- one State Head when one visible lineage advances without an unresolved Branch;
- multiple State Heads when concurrent or competing successors remain unresolved.

A State Head is not inherently:

- current;
- accepted;
- authoritative;
- approved;
- valid;
- semantically preferred.

Higher-level services determine whether and how one or more State Heads participate in a named projection.

### 14. Change semantics

A Change is an immutable atomic record that creates one or more States from explicitly identified prior States.

A Change must identify:

- zero or more input State references;
- one or more output States;
- every affected System;
- the predecessor relationship for every output State;
- sufficient identity to distinguish retry from a new semantic Change.

A Change may:

- advance one State Address;
- advance multiple State Addresses;
- create a Branch;
- merge Branches;
- create a new State Address;
- establish a new System;
- affect multiple Systems atomically.

A Change must produce at least one structural effect.

A no-op Change is invalid.

A Change does not independently define why it was authorized, whether it was correct, whether it was approved, or which workflow produced it.

### 15. Relationship between Change and Engineering Change

`Engineering Change` is the broader mission-level concept covering a meaningful proposed, performed, accepted, rejected, abandoned, superseded, or otherwise recorded alteration.

`Change` is the Kernel primitive that records an atomic structural creation of one or more States.

An Engineering Change may exist without producing a Kernel Change.

A single Engineering Change may produce:

- no Kernel Change;
- one Kernel Change;
- multiple causally related Kernel Changes.

One Kernel Change may affect multiple Systems when the structural effects form one atomic transaction.

Higher-level protocols define the mapping between Engineering Changes and Kernel Changes.

### 16. Change Identity

Every Change must have exactly one stable Change Identity.

A Change Identity must be:

- unambiguous within the applicable Atlas OS scope;
- distinct from every other Change Identity;
- immutable;
- independent of mutable presentation labels;
- never reused.

A Change Identity must not be derived solely from:

- a commit identifier;
- a pull-request identifier;
- a task identifier;
- a deployment identifier;
- an external workflow identifier;
- an AI session identifier.

Those identifiers may participate in provenance but do not independently define Change Identity.

### 17. Change inputs and outputs

Every input State referenced by a Change must exist before the Change commits.

Every output State must be new and must not already exist under another identity or System.

Every output State must identify its producing Change.

The Change must identify all affected Systems, including:

- every System owning an input State;
- every System owning an output State;
- every System established by the Change.

For Kernel purposes, an affected System is any System that is established by the Change or whose State participates as an input or output. Participation as an input does not imply that the System received new State.

A State in one System may serve as a causal input to an output State in another System.

Cross-System causality must remain explicit.

No State changes implicitly because another System changed.

### 18. Change immutability

A Change is immutable after commitment.

The following must not change:

- Change Identity;
- input State references;
- output State references;
- affected System references;
- predecessor relationships;
- atomic transaction membership;
- provenance required to interpret the structural transition.

A correction or reversal requires a new Change.

A committed Change must not be rewritten, deleted from logical history, or repositioned to create a different lineage.

### 19. Atomic application

A Change commits atomically across all declared structural effects.

Atomic application includes, as applicable:

- establishment of new Systems;
- creation of all output States;
- recording of all predecessor relationships;
- recording of all affected Systems;
- commitment of the Change itself.

Either all declared effects become visible as one committed Change or none do.

A failed application must not expose:

- a committed subset of output States;
- a partially established System;
- incomplete predecessor relationships;
- a committed Change missing declared effects.

The Kernel does not claim atomicity with external systems unless a later protocol defines a mechanism that preserves the Kernel contract.

### 20. Concurrency and Branches

Concurrent Changes may reference the same predecessor State.

When they create distinct successor States at the same State Address, the Kernel preserves a Branch.

The Kernel must not:

- overwrite one successor with another;
- select a winner by timestamp;
- silently discard a State;
- infer semantic compatibility;
- collapse distinct State identities;
- present one branch as the only lineage without an explicit higher-level selection rule.

Changes affecting disjoint State Addresses are structurally independent.

The Kernel does not infer that they are semantically independent.

A higher-level service may reject, select, or merge Branches according to explicit governance and protocol rules.

### 21. Merge Changes

A Merge Change may consume multiple States, including multiple State Heads from the same State Address.

A Merge Change must preserve every input relationship.

A Merge Change does not erase or retroactively invalidate its input Branches.

The Kernel does not determine whether merge content is semantically correct or whether all relevant differences were resolved.

A selection that does not create new State may exist as a higher-level projection or decision.

A durable semantic resolution that changes represented engineering information must be recorded through new State and Change.

### 22. Currentness and projections

The Kernel does not designate one monolithic Current State for a System.

A System’s apparent current engineering condition is a named projection over selected States or State Heads from multiple State Addresses.

Possible projections may represent:

- current implementation;
- current production reality;
- accepted architecture;
- intended architecture;
- active ownership;
- validated release condition;
- a bounded engineering context.

Different projections may legitimately select different States and may disagree.

The semantics, selection policy, authority, and presentation of projections belong to higher-level services and specifications.

A materialized or cached projection is derived and disposable.

It must not replace the underlying State and Change graph as canonical Kernel structure.

### 23. Whole-System snapshots

A whole-System snapshot may be produced as a derived projection for convenience, export, caching, or implementation optimization.

A whole-System snapshot must not become the canonical definition of State.

A snapshot must preserve provenance to the States and Changes from which it was derived.

The Kernel must not require unrelated State Addresses to advance together merely to maintain a monolithic snapshot.

### 24. State condition distinctions

State Content representations must be capable of distinguishing, where applicable:

- known zero;
- known empty;
- missing;
- unknown;
- not applicable.

The Kernel preserves the structural distinction when the representation supplies it.

The Kernel does not determine which condition is semantically correct for a domain property.

Distinct conditions must not be collapsed into one undifferentiated null, empty, false, zero, or absent value when their meanings differ.

### 25. Cross-System behavior

A Change may affect multiple Systems atomically.

Every affected System must be enumerated explicitly.

Every input and output State must retain exactly one owning System.

The Kernel provides no implicit:

- State propagation;
- authority propagation;
- inheritance;
- composition behavior;
- deletion cascade;
- synchronization;
- semantic compatibility.

A cross-System Change guarantees only the atomic structural effects declared by that Change.

Independent cross-System effects are represented as separate Changes connected through explicit causal or protocol relationships.

### 26. System split and merge

A System split does not rewrite one historical System as though it had always been multiple Systems.

A split may be represented by a Change that:

- establishes new Systems;
- creates Origin States for those Systems;
- references relevant States from the original System;
- creates State describing the resulting topology or lifecycle condition.

A System merge may establish a new System or preserve one surviving System, according to higher-level governance.

The Kernel preserves all prior identities and lineages.

The Kernel does not decide split or merge policy.

### 27. Kernel structural guarantees

The Kernel guarantees:

- stable identity for every System, State, and Change;
- immutable State and Change records;
- explicit State Address coordinates;
- content-verifiable State;
- traceable origin for every State and a producing Change for every non-origin State;
- explicit input, output, predecessor, and affected-System relationships;
- atomic Change application;
- acyclic State Lineage;
- visible Branches;
- explicit cross-System effects;
- preservation of prior State and Change history;
- structural distinction between primitives and derived projections.

These guarantees do not establish semantic truth or policy compliance.

### 28. Kernel invariants

#### 28.1 System invariants

- Every System has one stable System Identity.
- A System Identity is never reused.
- A System represents exactly one Software System within the applicable scope.
- System identity is independent of mutable implementation and organizational properties.
- System creation is traceable through an Origin Change or equivalent indivisible Kernel establishment operation.

#### 28.2 State invariants

- Every State has one stable State Identity.
- Every State belongs to exactly one System.
- Every State occupies exactly one State Address.
- Every State has one Scope Reference and one Facet Reference.
- Every State is immutable and content-verifiable.
- Every non-origin State identifies exactly one producing Change.
- Every Origin State identifies either an Origin Change or the indivisible Kernel establishment operation that created it.
- State Identity is never reused.

#### 28.3 Change invariants

- Every Change has one stable Change Identity.
- Every Change has zero or more existing input States.
- Every Change creates one or more new output States.
- Every Change identifies every affected System.
- Every output State identifies its producing Change and predecessor relationship.
- Every Change is immutable after commitment.
- Change Identity is never reused.
- A Change has at least one structural effect.

#### 28.4 Lineage invariants

- State Lineage is acyclic.
- Predecessor relationships are explicit and immutable.
- Causal order derives from lineage rather than timestamp order.
- Concurrent successors remain visible.
- Branches are not silently collapsed.
- Merge Changes preserve all input relationships.

#### 28.5 Atomicity invariants

- All effects declared by one Change commit atomically.
- A failed Change exposes none of its declared committed effects.
- A multi-System Change enumerates every affected System.
- No State changes implicitly because another System changed.

### 29. Semantic policy exclusion

The Kernel must not determine:

- which State Heads are current;
- which States are authoritative;
- whether State Content is valid;
- whether a Branch is a semantic conflict;
- whether a merge is correct;
- whether an Engineering Change is authorized;
- whether Evidence is sufficient;
- whether risk is acceptable;
- which Context is sufficient;
- which Workspace should be assembled;
- which external source should be trusted;
- which user-facing terms should be presented.

The Kernel may enforce only structural conditions required by this document.

Higher-level policy must not weaken Kernel invariants.

### 30. Kernel and higher-level services

Higher-level services may:

- interpret Scope References and Facet References;
- define schemas for State Content;
- evaluate authority and acceptance;
- produce currentness projections;
- evaluate semantic compatibility;
- detect drift across State Addresses;
- resolve Branches through explicit policy and Change;
- coordinate Engineering Changes;
- validate claims and Evidence;
- integrate external systems;
- assemble Context and Workspace views.

Higher-level services must not:

- mutate State or Change;
- hide a Branch as though it never existed;
- redefine State as a monolithic snapshot;
- treat a State Head as inherently current or authoritative;
- bypass atomic Change application;
- create implicit cross-System effects;
- introduce a fourth Kernel primitive.

### 31. Kernel non-guarantees

The Kernel does not guarantee that State Content is:

- objectively true;
- complete;
- current within any named projection;
- free from contradiction;
- semantically valid;
- safe;
- compliant;
- approved;
- trusted;
- tested;
- supported by sufficient Evidence.

The Kernel does not guarantee that a Change is:

- desirable;
- authorized;
- aligned with user intent;
- technically correct;
- free from regression;
- reversible;
- compatible with external systems;
- semantically meaningful.

The Kernel does not define:

- Governance;
- Assurance;
- Context selection;
- Workspace behavior;
- Branch-resolution policy;
- projection policy;
- lifecycle behavior;
- API behavior;
- persistence technology;
- retention duration;
- security controls;
- failure recovery;
- external-system transactionality;
- performance or availability guarantees.

Those properties may be required of Atlas OS as a whole but are not Kernel semantics.

### 32. Conformance to the Kernel

An architecture or implementation conforms to this Kernel specification only when it:

- represents System, State, and Change with the semantics defined here;
- preserves all required identities and relationships;
- preserves State Address structure;
- preserves content verifiability;
- preserves State and Change immutability;
- preserves atomic Change application;
- preserves Branch visibility;
- preserves explicit cross-System effects;
- derives currentness through higher-level projection rather than a monolithic Current State primitive;
- does not introduce an additional normative primitive;
- does not place semantic policy inside the Kernel.

An implementation may introduce internal constructs when they have no independent Atlas OS semantics and may be replaced without changing the Kernel model.

## Requirements

**Document Prefix:** `KER`

### Primitive model

**KER-001**  
The Atlas OS Kernel MUST contain exactly three primitive types: System, State, and Change.

**KER-002**  
The Kernel MUST NOT introduce an additional primitive unless an Accepted specification revision demonstrates that required structural semantics cannot be represented using System, State, Change, and their relationships.

**KER-003**  
Implementation convenience, performance, storage design, service ownership, or interface design MUST NOT independently justify an additional Kernel primitive.

**KER-004**  
System, State, and Change MUST retain distinct normative responsibilities.

### System

**KER-005**  
A System MUST represent exactly one Software System.

**KER-006**  
Every governed Software System MUST be represented by exactly one System within the applicable Atlas OS scope.

**KER-007**  
Every System MUST have exactly one stable System Identity.

**KER-008**  
A System Identity MUST be unambiguous within the applicable Atlas OS scope.

**KER-009**  
A System Identity MUST NOT be derived solely from mutable State Content, labels, repositories, deployments, organizational ownership, tools, or external vendor identifiers.

**KER-010**  
A System Identity MUST NOT be reused for a different System.

**KER-011**  
Changes to implementation, repositories, deployment topology, ownership, Actors, tools, or external integrations MUST NOT independently change System Identity.

**KER-012**  
A System MUST remain distinct from its States and Changes.

### State identity, ownership, and integrity

**KER-014**  
Every State MUST have exactly one stable State Identity.

**KER-015**  
A State Identity MUST be unambiguous within the applicable Atlas OS scope.

**KER-016**  
A State Identity MUST NOT be reused.

**KER-017**  
Every State MUST belong to exactly one System.

**KER-018**  
A State MUST NOT belong to or be transferred between multiple Systems.

**KER-019**  
A State MUST be immutable after establishment.

**KER-020**  
A change to the normative meaning of State Content MUST create a new State.

**KER-021**  
Equivalent State Content MUST NOT cause distinct State Identities to be treated as the same State.

**KER-022**  
The Kernel MUST NOT require all Engineering State to be contained in one State or in Kernel State Content.

### Change identity and immutability

**KER-036**  
Every Change MUST have exactly one stable Change Identity.

**KER-037**  
A Change Identity MUST be unambiguous within the applicable Atlas OS scope.

**KER-038**  
A Change Identity MUST NOT be reused.

**KER-046**  
A Change MUST be immutable after commitment.

**KER-047**  
A committed Change's inputs, outputs, affected Systems, predecessor relationships, and atomic transaction membership MUST NOT be altered.

### Atomic failure behavior

**KER-050**  
A failed Change application MUST NOT expose a committed Change, a committed subset of output States, or a partially established System.

### State condition distinctions

**KER-064**  
State Content representations MUST be capable of distinguishing known zero, known empty, missing, unknown, and not-applicable conditions where those distinctions apply.

**KER-065**  
Distinct State conditions MUST NOT be collapsed into one undifferentiated null, empty, false, zero, or absent representation when their meanings differ.

**KER-066**  
The Kernel MUST NOT determine which State condition is semantically valid for a domain property.

### External content

**KER-067**  
A State MAY represent State Content directly, by immutable reference, or through a combination of both.

**KER-068**  
An external State Content reference MUST preserve sufficient immutable identity or digest information to prevent the meaning of an existing State from changing silently.

**KER-069**  
The Kernel MUST NOT require physical duplication of all externally maintained State Content.

### Semantic policy boundary

**KER-070**  
The Kernel MUST define structural identity, relationships, atomic Changes, and invariants without defining semantic policy.

**KER-071**  
The Kernel MUST NOT determine Software System boundaries.

**KER-072**  
The Kernel MUST NOT determine the domain-specific meaning or required contents of State.

**KER-073**  
The Kernel MUST NOT determine whether an Engineering Change is authorized, desirable, safe, correct, or sufficiently validated.

**KER-074**  
The Kernel MUST NOT define Governance, Review, Validation, Assurance, Context, Workspace, or interaction policy.

**KER-075**  
Higher-level semantic policy MUST NOT change the meanings or invariants of System, State, or Change.

### Relationship to mission concepts

**KER-076**  
System MUST be the Kernel representation of the mission-level Software System.

**KER-077**  
State MUST remain narrower than the mission-level Engineering State.

### Cross-System ownership

**KER-081**  
The Kernel MUST preserve State ownership and System identity guarantees independently for every System participating in a multi-System Change.

### Structural versus semantic correctness

**KER-083**  
Kernel structural validity MUST NOT be treated as proof that State Content is true, complete, correct, approved, current, or sufficiently validated.

**KER-084**  
Kernel commitment of a Change MUST NOT be treated as proof that the corresponding Engineering Change is safe, desirable, compatible, or free from regression.

### Conformance

**KER-085**  
A conforming implementation MUST preserve all Kernel invariants defined by this document.

**KER-086**  
A conforming implementation MUST NOT expose a fourth normative Kernel primitive.

**KER-087**  
An internal implementation construct MAY exist without becoming a Kernel primitive only when it has no independent Atlas OS semantics.

**KER-088**  
An operation that would violate a Kernel invariant MUST NOT become committed Kernel structure.

### Scoped State model

**KER-089**  
A State MUST be an immutable scoped assertion about exactly one System rather than a complete or monolithic representation of that System.

**KER-090**  
Every State MUST occupy exactly one State Address composed of its System Identity, Scope Reference, and Facet Reference.

**KER-091**  
Every State MUST identify exactly one Scope Reference and exactly one Facet Reference.

**KER-092**  
The Kernel MUST compare Scope References and Facet References for identity and equality without interpreting their domain meaning.

**KER-093**  
Every State MUST carry or resolve an immutable content identity, digest, or equivalent integrity guarantee.

**KER-094**  
A State MUST NOT inherently imply completeness, truth, approval, acceptance, currentness, validity, or semantic compatibility.

**KER-095**  
A whole-System snapshot MUST be treated as a derived projection rather than the canonical State primitive.

### Origin and lineage

**KER-096**  
Every non-origin State MUST identify exactly one producing Change.

**KER-097**  
An Origin State MUST have no predecessor State at its State Address and MUST identify either an Origin Change or the indivisible Kernel establishment operation that created it.

**KER-098**  
Establishment of a new System and at least one Origin State for that System MUST occur as one indivisible Kernel operation.

**KER-099**  
When a Change advances an existing State Address, each output State at that address MUST identify one or more predecessor States at the same address.

**KER-100**  
State Lineage MUST be explicit, immutable, traceable, and acyclic.

**KER-101**  
Timestamp order MUST NOT substitute for explicit State Lineage or causal relationships.

### Change structure and atomicity

**KER-102**  
A Change MUST reference zero or more existing input States and MUST create one or more new output States.

**KER-103**  
A Change MUST identify every affected System.

**KER-104**  
A Change MUST produce at least one structural effect and MUST NOT be a no-op.

**KER-105**  
All Systems, States, and lineage relationships declared by one Change MUST commit atomically or not commit at all.

**KER-106**  
A Change MAY create States at multiple State Addresses and MAY affect multiple Systems.

**KER-107**  
Cross-System inputs, outputs, and effects MUST be explicit and MUST NOT propagate implicitly.

### Concurrency, branching, and merging

**KER-108**  
Two or more States that descend from the same predecessor State at the same State Address without one descending from another MUST remain visible as a Branch.

**KER-109**  
The Kernel MUST NOT resolve a Branch through overwrite, timestamp ordering, last-write-wins behavior, or silent State deletion.

**KER-110**  
A State Address MAY have multiple State Heads.

**KER-111**  
A Merge Change MUST preserve every input State and predecessor relationship it merges.

### Currentness and projections

**KER-112**  
The Kernel MUST NOT designate one monolithic Current State for a System.

**KER-113**  
Currentness, acceptance, authority, and semantic preference MUST be established through higher-level policy or named projections over State and State Lineage.

**KER-114**  
A materialized projection MUST remain distinguishable from canonical State and Change structure and MUST preserve provenance to its sources.

### Retired requirement identifiers

The following Version 0.1 Requirement Identifiers are retired because they encoded the rejected monolithic-State, singular-sequence, or single-System-Change model:

| Retired identifiers | Replacement area |
|---|---|
| `KER-013` | `KER-089` through `KER-095` |
| `KER-023` through `KER-035` | `KER-096` through `KER-101`, `KER-112` through `KER-114` |
| `KER-039` through `KER-045` | `KER-102` through `KER-107` |
| `KER-048`, `KER-049` | `KER-105`, retained `KER-050` |
| `KER-051` through `KER-063` | `KER-100`, `KER-101`, `KER-108` through `KER-111` |
| `KER-078` through `KER-080` | `KER-102` through `KER-107`, `KER-113` |
| `KER-082` | `KER-105` through `KER-107` |

Retired identifiers must not be reused.

## Non-goals

This document does not define:

1. The semantic vocabulary of Scope References.
2. The semantic vocabulary of Facet References.
3. State Content schemas.
4. Schema validation.
5. Which States are accepted.
6. Which States are authoritative.
7. Which State Heads are selected by a projection.
8. Branch-resolution policy.
9. Semantic conflict detection.
10. Compatibility rules.
11. Governance policy.
12. Authority topology.
13. Authorization behavior.
14. Review behavior.
15. Assurance Claims.
16. Evidence schemas.
17. Context-selection rules.
18. Workspace behavior.
19. Engineering Change lifecycle.
20. Protocol ordering.
21. API operations.
22. Persistence technology.
23. Physical graph representation.
24. Database schemas.
25. Retention duration.
26. Deletion policy.
27. Security controls.
28. Trust policy.
29. Failure recovery.
30. External-system transactionality.
31. Deployment topology.
32. Programming language.
33. Framework selection.
34. Repository layout.
35. User-interface design.
36. AI-provider behavior.

## Open Questions

No Open Question blocks interpretation of this Draft.

The following matters remain intentionally deferred:

1. The canonical vocabulary and governance of Scope References and Facet References.
2. The contract by which named projections select State Heads.
3. The protocol semantics for selecting, rejecting, or merging Branches.
4. The persistence guarantees required to retain and reconstruct Kernel lineage.
5. The relationship between one Engineering Change and one or more Kernel Changes.

Those matters belong to later Specification Documents and must preserve this Kernel model.

## Future Considerations

No Future Considerations are currently defined.

A future revision may alter the Kernel only when:

1. a contradiction, ambiguity, implementation conflict, or architectural inconsistency demonstrates that the current Kernel cannot satisfy the Atlas OS Mission and Design Principles;
2. the issue cannot be resolved through services, protocols, policy, interfaces, persistence, or implementation;
3. an accepted Architecture Decision Record documents the required change;
4. all dependent Specification Documents undergo impact review;
5. the revision is accepted through `00-specification-governance.md`.

A useful higher-level concept does not by itself justify promotion into the Kernel.
