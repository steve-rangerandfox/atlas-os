# Atlas OS Terminology

**Status:** Draft  
**Version:** 0.3

## Purpose

This document establishes terminology governance for the Atlas OS Specification.

It defines:

- how Canonical Terms are named;
- how normative definitions are owned;
- how Canonical Terms are capitalized;
- how aliases and abbreviations are approved;
- how User-Facing Names relate to Canonical Terms;
- how reserved terms are assigned to future specification documents;
- how competing names are resolved;
- how synonyms are restricted;
- how terminology conflicts are identified and corrected;
- how the canonical terminology registry is maintained.

This document is a Derived Document.

It does not define Atlas OS architecture or runtime behavior.

A concept’s normative meaning belongs to the Specification Document that owns that concept. This document records the concept’s Canonical Name, Term Owner, capitalization, permitted aliases, and naming status without replacing the owning definition.

## Dependencies

This document normatively depends on:

1. `01-atlas-mission.md`
2. `05-design-principles.md`
3. `10-kernel.md`
4. `20-service-architecture.md`
5. `30-interaction-model.md`

This document is governed by:

- `00-specification-governance.md`, Version 0.1 Draft.

At the time of this draft:

- `01-atlas-mission.md`, Version 0.2 Draft, has been authored and reviewed;
- `05-design-principles.md`, Version 0.2 Draft, has been authored and reviewed;
- `10-kernel.md`, Version 0.2 Draft, has been authored and reviewed;
- `20-service-architecture.md`, Version 0.2 Draft, has been authored and reviewed;
- `30-interaction-model.md` has not been authored.

Terms owned by unauthored dependencies are reserved in this document but are not defined by it.

This document cannot become Accepted until all declared dependencies have been authored and the terminology registry has been reviewed against them.

## Definitions

### Alias

An approved alternate name for a Canonical Term.

An Alias refers to the same concept as its Canonical Term and does not create independent meaning.

### Bare Term

A term used without a qualifying word that identifies its normative scope.

Examples include `System`, `State`, `Change`, `Branch`, `Projection`, `Review`, `Service`, and `Context`.

A Bare Term must be qualified when unqualified use would create ambiguity.

### Canonical Name

The exact name assigned to a Canonical Term.

A Canonical Name includes its required capitalization.

### Canonical Registry

The collection of term records maintained by this document.

Each record identifies, as applicable:

- the Canonical Name;
- the Term Owner;
- the term status;
- permitted aliases;
- naming restrictions.

### Canonical Term

A term whose name, ownership, capitalization, and normative meaning are established by the Canonical Specification.

### Capitalized Form

The exact capitalization used when referring to a Canonical Term.

### Deprecated Alias

An Alias retained for historical or compatibility purposes but prohibited in new normative text.

### Descriptive Label

A non-normative name used for presentation, navigation, explanation, branding, organizational convention, or implementation-specific communication.

### Descriptive Term

A word or phrase used in its ordinary meaning rather than as a specialized Atlas OS term.

### Local Definition

A definition whose applicability is explicitly limited to one document or section.

A Local Definition may narrow the application of a Canonical Term but must not change its canonical meaning.

### Naming Precedence

The ordered rule used to determine which name must govern when multiple names refer to the same concept.

### Qualified Term

A term containing an additional qualifier required to distinguish it from another term.

Examples include:

- `Software System`;
- `Engineering Change`;
- `Specification Review`.

### Reserved Term

A name assigned to a specification document or architectural area before its normative meaning has been defined.

Reservation prevents conflicting use but does not establish architectural semantics.

### Term Owner

The Specification Document with normative authority to define a Canonical Term.

A Canonical Term has exactly one Term Owner.

### User-Facing Name

A name presented through an interaction surface as an alternative representation of a Canonical Term.

A User-Facing Name does not create independent semantics.

## Specification

### 1. Terminology authority

This document is the canonical registry of Atlas OS terminology.

It governs:

- Canonical Names;
- capitalization;
- Term Ownership;
- aliases;
- abbreviations;
- User-Facing Names;
- Reserved Terms;
- Naming Precedence;
- synonym policy.

This document does not own the normative meaning of terms defined by other Specification Documents.

The authoritative meaning of a Canonical Term is the definition in its Term Owner.

Where this document conflicts with an Accepted Term Owner:

1. the conflict is an Inconsistency;
2. the owning definition governs interpretation;
3. the conflict must be corrected explicitly;
4. this document must not silently modify the owning definition.

### 2. Single-definition model

Every Canonical Term must have exactly one Term Owner.

A Canonical Term must be defined normatively in exactly one Specification Document.

Other Specification Documents may:

- reference the term;
- use the term according to its canonical definition;
- define a Local Definition that narrows its application without changing its meaning;
- map the term to a User-Facing Name;
- provide informative examples.

Other Specification Documents must not:

- provide an alternate normative definition;
- assign a second meaning to the same Capitalized Form;
- treat an Alias as a separate concept;
- redefine a term for stylistic preference.

This document records definitions by reference rather than duplicating them.

### 3. Canonical naming

Each Canonical Term must have one Canonical Name.

The Canonical Name must be used in normative text unless:

- a Qualified Term is required to avoid ambiguity;
- a permitted Alias is explicitly allowed;
- a mapped User-Facing Name is used within its defined interaction scope;
- a valid Local Definition requires a more specific form.

Multiple normative synonyms for the same concept are prohibited unless one name is explicitly registered as an Alias.

A shorter or more familiar term must not replace the Canonical Name when the substitution would remove a required distinction.

### 4. Capitalization

Canonical Terms must use the Capitalized Form recorded by their Term Owner or this registry.

Canonical Terms normally use Title Case.

Established abbreviations and acronyms retain their approved capitalization.

Examples include:

- `Atlas OS`;
- `AI Agent`;
- `Architecture Decision Record`;
- `Software System`;
- `Engineering Change`.

Plural and possessive forms retain canonical capitalization.

Examples include:

- `Software Systems`;
- `Engineering Changes`;
- `Actor’s authority`.

Lowercase use of the same words is descriptive unless the surrounding text explicitly references the Canonical Term.

Capitalization identifies the referenced concept.

Capitalization does not independently make a statement normative.

### 5. Normative and descriptive use

A term is normative when it refers to a Canonical Term as defined by its Term Owner.

A term is descriptive when it is used according to ordinary language without invoking a specialized Atlas OS definition.

A word may appear in a normative Requirement without becoming a Canonical Term.

A Canonical Term may appear in Informative Content without creating a new Requirement.

Specification authors should create a Canonical Term only when stable specialized meaning is required.

Ordinary engineering vocabulary should remain descriptive where its common meaning is sufficient.

### 6. Product naming

The Canonical Name of the product is:

> Atlas OS

`Atlas` is a permitted Alias in:

- document titles established by the frozen Specification Architecture;
- headings;
- informal discussion;
- Informative Content;
- interface branding where the reference is unambiguous.

Normative Requirements referring to the complete product must use `Atlas OS`.

`Atlas` and `Atlas OS` do not name separate products.

`Atlas Operating System` is not a Canonical Name.

`AOS` is not an approved abbreviation.

### 7. Naming precedence

When multiple names refer to the same concept, the following Naming Precedence applies:

1. Canonical Name
2. Qualified Term required to remove ambiguity
3. valid Local Definition
4. mapped User-Facing Name
5. permitted Alias
6. Descriptive Label

A lower-precedence name must not alter the meaning established by a higher-precedence name.

Naming Precedence applies only when multiple names refer to the same concept.

It must not be used to collapse distinct concepts into one term.

Where a Bare Term is ambiguous, a Qualified Term must be used.

### 8. Alias policy

An Alias must be explicitly registered by this document or by the Term Owner.

An Alias must preserve:

- concept identity;
- normative meaning;
- scope;
- ownership;
- conformance obligations.

An Alias must not:

- broaden or narrow the concept;
- create a subtype;
- create a separate lifecycle;
- change authority;
- create independent requirements;
- conceal a distinction required by the specification.

A Deprecated Alias must not be introduced in new normative text.

An unregistered alternate name is descriptive and must not be treated as normative.

### 9. User-Facing Names

A User-Facing Name may be defined by the Interaction Model or another authorized interaction specification.

A User-Facing Name must be explicitly mapped to a Canonical Term.

The mapping must identify:

- the User-Facing Name;
- the Canonical Term;
- the applicable interface or audience;
- whether the mapping is one-to-one;
- any conditions under which the Canonical Name must be exposed.

A User-Facing Name must not:

- change the identity of the concept;
- change the concept’s normative meaning;
- change ownership;
- change lifecycle semantics;
- create alternate conformance requirements;
- collapse distinct Canonical Terms when the distinction affects behavior.

When a User-Facing Name conflicts with a Canonical Name, the Canonical Name governs interpretation.

### 10. Local Definitions

A Local Definition must identify:

- the Canonical Term being narrowed;
- the scope in which the narrower use applies;
- the reason the narrower use is required;
- its relationship to the canonical definition.

A Local Definition must not:

- contradict the Term Owner;
- broaden the Canonical Term;
- replace the Canonical Name;
- change the identity of the concept;
- apply outside its declared scope.

A new concept must receive its own Canonical Name rather than being introduced through a conflicting Local Definition.

### 11. Reserved normative keywords

The following uppercase words are Reserved Terms governed by `00-specification-governance.md`:

- `MUST`
- `MUST NOT`
- `REQUIRED`
- `SHALL`
- `SHALL NOT`
- `SHOULD`
- `SHOULD NOT`
- `RECOMMENDED`
- `MAY`
- `OPTIONAL`

These terms must not be assigned Atlas OS architectural meanings.

Lowercase forms do not carry their defined normative-keyword meaning.

### 12. Accepted specification-term registry

The following Specification Terms are owned by `00-specification-governance.md`.

Their definitions remain authoritative in that document.

| Canonical Name | Term Owner | Permitted Alias | Naming restriction |
|---|---|---|---|
| Accepted | `00-specification-governance.md` | None | Reserved as a Specification Document status. |
| Architecture Decision Record | `00-specification-governance.md` | `ADR` | The abbreviation may be used after its meaning is established. |
| Canonical Specification | `00-specification-governance.md` | None | Refers only to the current Accepted specification set. |
| Conflict | `00-specification-governance.md` | None | Capitalized use is restricted to the governance-defined concept. |
| Dependency | `00-specification-governance.md` | None | Capitalized use refers to a normative specification dependency. |
| Derived Document | `00-specification-governance.md` | None | Must not be shortened to `Derived` in normative text. |
| Document Prefix | `00-specification-governance.md` | None | Must not be confused with a filename prefix. |
| Draft | `00-specification-governance.md` | None | Reserved as a Specification Document status. |
| Editorial Change | `00-specification-governance.md` | None | Must not be shortened where change classification matters. |
| Future Consideration | `00-specification-governance.md` | None | Refers to the required non-normative specification section. |
| Implementation-Independent | `00-specification-governance.md` | None | Hyphenation and capitalization must be preserved. |
| Inconsistency | `00-specification-governance.md` | None | Capitalized use refers to the governance-defined defect category. |
| Informative Content | `00-specification-governance.md` | None | Must not be shortened where normative status could be ambiguous. |
| Normative Content | `00-specification-governance.md` | None | Must not be shortened where normative status could be ambiguous. |
| Open Question | `00-specification-governance.md` | None | Refers to the required non-normative specification section. |
| Requirement | `00-specification-governance.md` | None | Refers to an atomic normative statement. |
| Requirement Identifier | `00-specification-governance.md` | `Requirement ID` | The Alias is permitted in Informative Content. |
| Review | `00-specification-governance.md` | `Specification Review` | Bare `Review` currently refers to specification review. |
| Specification Architecture | `00-specification-governance.md` | None | Refers to the frozen specification structure. |
| Specification Document | `00-specification-governance.md` | None | Must not be shortened where document status matters. |
| Specification Release | `00-specification-governance.md` | None | Must not be confused with an implementation release. |
| Superseded | `00-specification-governance.md` | None | Reserved as a Specification Document status. |
| Withdrawn | `00-specification-governance.md` | None | Reserved as a Specification Document status. |

### 13. Accepted mission-term registry

The following Domain Terms are owned by `01-atlas-mission.md`.

Their definitions remain authoritative in that document.

| Canonical Name | Term Owner | Permitted Alias | Naming restriction |
|---|---|---|---|
| Actor | `01-atlas-mission.md` | None | `User` is not an automatic synonym. |
| Adopter | `01-atlas-mission.md` | None | `Customer`, `organization`, and `tenant` are not normative synonyms. |
| AI Agent | `01-atlas-mission.md` | None | Bare `agent` is descriptive unless explicitly scoped. |
| AI-Native Software Engineering | `01-atlas-mission.md` | None | Informal shortened forms are descriptive. |
| Authoritative | `01-atlas-mission.md` | None | Must be interpreted within a defined scope. |
| Coherent Software Evolution | `01-atlas-mission.md` | None | Must not be replaced by Bare `coherence` in normative text. |
| Demonstrated Correctness | `01-atlas-mission.md` | None | `Correctness`, `proof`, and `test success` are not synonyms. |
| Engineering Change | `01-atlas-mission.md` | None | Tasks, commits, pull requests, and deployments are not automatic synonyms. |
| Engineering State | `01-atlas-mission.md` | None | Bare `State` is reserved separately. |
| Instantiation Surface | `01-atlas-mission.md` | None | `Tool`, `interface`, and `integration` are not automatic synonyms. |
| Institutional Memory | `01-atlas-mission.md` | None | `History`, `documentation`, and `knowledge base` are not synonyms. |
| Operating Environment | `01-atlas-mission.md` | None | Must not be confused with deployment or runtime environment. |
| Software System | `01-atlas-mission.md` | None | `Project`, `Product`, `Repository`, and Bare `System` are not automatic synonyms. |
| Software System Evolution | `01-atlas-mission.md` | None | Bare `evolution` is descriptive. |

### 14. Terminology-governance registry

The following terms are owned by this document.

| Canonical Name | Term Owner | Permitted Alias |
|---|---|---|
| Alias | `02-terminology.md` | None |
| Bare Term | `02-terminology.md` | None |
| Canonical Name | `02-terminology.md` | None |
| Canonical Registry | `02-terminology.md` | Term Registry |
| Canonical Term | `02-terminology.md` | None |
| Capitalized Form | `02-terminology.md` | None |
| Deprecated Alias | `02-terminology.md` | None |
| Descriptive Label | `02-terminology.md` | None |
| Descriptive Term | `02-terminology.md` | None |
| Local Definition | `02-terminology.md` | None |
| Naming Precedence | `02-terminology.md` | None |
| Qualified Term | `02-terminology.md` | None |
| Reserved Term | `02-terminology.md` | None |
| Term Owner | `02-terminology.md` | None |
| User-Facing Name | `02-terminology.md` | None |

### 15. Dependency-owned and reserved-term registry

The following names are assigned to Specification Documents that own or are expected to own their normative definitions.

A term with status **Defined in Draft** has been defined by its assigned Term Owner but has not yet acquired Accepted status.

A term with status **Reserved** has been assigned to a future Term Owner but has not yet been normatively defined.

Assignment in this registry establishes naming ownership.

It does not transfer normative-definition ownership to this document.

| Term | Assigned Term Owner | Status |
|---|---|---|
| Design Principle | `05-design-principles.md` | Defined in Draft |
| Kernel | `10-kernel.md` | Defined in Draft |
| System | `10-kernel.md` | Defined in Draft |
| System Identity | `10-kernel.md` | Defined in Draft |
| State | `10-kernel.md` | Defined in Draft |
| State Identity | `10-kernel.md` | Defined in Draft |
| State Address | `10-kernel.md` | Defined in Draft |
| Scope Reference | `10-kernel.md` | Defined in Draft |
| Facet Reference | `10-kernel.md` | Defined in Draft |
| State Lineage | `10-kernel.md` | Defined in Draft |
| State Head | `10-kernel.md` | Defined in Draft |
| Origin State | `10-kernel.md` | Defined in Draft |
| Branch | `10-kernel.md` | Defined in Draft |
| Change | `10-kernel.md` | Defined in Draft |
| Change Identity | `10-kernel.md` | Defined in Draft |
| Origin Change | `10-kernel.md` | Defined in Draft |
| Merge Change | `10-kernel.md` | Defined in Draft |
| Service | `20-service-architecture.md` | Defined in Draft |
| Service Architecture | `20-service-architecture.md` | Defined in Draft |
| Logical Service | `20-service-architecture.md` | Defined in Draft |
| Service Boundary | `20-service-architecture.md` | Defined in Draft |
| Service Result | `20-service-architecture.md` | Defined in Draft |
| Durable Service Result | `20-service-architecture.md` | Defined in Draft |
| Ephemeral Service Result | `20-service-architecture.md` | Defined in Draft |
| Semantic Integrity | `20-service-architecture.md` | Defined in Draft |
| Projection | `20-service-architecture.md` | Defined in Draft |
| Governance Service | `20-service-architecture.md` | Defined in Draft |
| Change Control Service | `20-service-architecture.md` | Defined in Draft |
| Assurance Service | `20-service-architecture.md` | Defined in Draft |
| Context and Projection Service | `20-service-architecture.md` | Defined in Draft |
| Integration Service | `20-service-architecture.md` | Defined in Draft |
| Interaction Model | `30-interaction-model.md` | Reserved |
| User | `30-interaction-model.md` | Reserved |
| Project | `30-interaction-model.md` | Reserved |
| Product | `30-interaction-model.md` | Reserved |
| Current Reality | `30-interaction-model.md` | Reserved |
| Current Context | `30-interaction-model.md` | Reserved |
| Protocol | `40-change-protocol.md` | Reserved |
| Change Protocol | `40-change-protocol.md` | Reserved |
| Change Lifecycle | `41-change-lifecycle.md` | Reserved |
| Governance | `42-review-and-governance.md` | Reserved |
| Authority | `42-review-and-governance.md` | Reserved |
| Authorization | `42-review-and-governance.md` | Reserved |
| Engineering Review | `42-review-and-governance.md` | Reserved |
| Validation | `43-validation-and-assurance.md` | Reserved |
| Assurance | `43-validation-and-assurance.md` | Reserved |
| Claim | `43-validation-and-assurance.md` | Reserved |
| Evidence | `43-validation-and-assurance.md` | Reserved |
| Context | `44-workspace-and-context.md` | Reserved |
| Workspace | `44-workspace-and-context.md` | Reserved |
| Integration | `45-integration-and-adapters.md` | Reserved |
| Adapter | `45-integration-and-adapters.md` | Reserved |
| API | `50-api-model.md` | Reserved |
| Persistence | `60-storage-and-persistence.md` | Reserved |
| Security | `70-security-and-trust.md` | Reserved |
| Trust | `70-security-and-trust.md` | Reserved |
| Failure | `71-failure-and-recovery.md` | Reserved |
| Recovery | `71-failure-and-recovery.md` | Reserved |
| Conformance | `80-conformance-and-compatibility.md` | Reserved |
| Compatibility | `80-conformance-and-compatibility.md` | Reserved |

A term with status **Defined in Draft** must be interpreted according to its Term Owner.

Its Canonical Name may change only through an explicit amendment to the Term Owner and a corresponding registry amendment.

A term with status **Reserved** does not yet have normative architectural semantics.

Its future Term Owner may retain, qualify, replace, or decline to use the reserved name.

If a Term Owner selects a different Canonical Name, this registry must be revised explicitly.

### 16. Bare terms and qualification

A Bare Term must not be used normatively when it could refer to more than one concept.

The following Bare Terms require particular care:

- `System`;
- `State`;
- `Change`;
- `Branch`;
- `Projection`;
- `Review`;
- `Service`;
- `Context`.

`System`, `State`, `Change`, `Branch`, and the qualified Kernel terms registered in Section 15 are owned by `10-kernel.md`.

Their Capitalized Forms must be used when referring to the canonical Kernel concepts defined by that document. Only `System`, `State`, and `Change` are Kernel primitives.

Lowercase `system`, `state`, `change`, `branch`, and `projection` remain descriptive when their ordinary meanings are intended.

`Engineering Change` and Kernel `Change` are distinct Canonical Terms owned by different Specification Documents:

- `Engineering Change` is owned by `01-atlas-mission.md`;
- `Change` is owned by `10-kernel.md`.

`Change` must not be used as shorthand for `Engineering Change`.

`Engineering Change` must not be used as an alternate name for Kernel `Change`.

Bare `Review` is owned by `00-specification-governance.md`.

Future runtime review concepts must use a Qualified Term unless ownership of Bare `Review` is explicitly revised.

`Service` and `Projection` are owned by `20-service-architecture.md`.

`Context` remains a Reserved Term until its assigned Term Owner defines it.

### 17. Synonym policy

Canonical Terms must not acquire competing normative synonyms through ordinary use.

The following substitutions are prohibited unless a future Accepted specification explicitly establishes an Alias or equivalence:

| Canonical Term | Prohibited automatic substitutions |
|---|---|
| Atlas OS | Atlas Operating System, AOS |
| Software System | System, Project, Product, Repository |
| Engineering Change | Change, task, ticket, commit, pull request, deployment, release |
| Change | Engineering Change, task, ticket, commit, pull request, deployment, release |
| Engineering State | State, context, history, documentation |
| Actor | User, person, agent, operator |
| Adopter | Customer, organization, tenant |
| AI Agent | Agent, bot, automation |
| Demonstrated Correctness | Correctness, proof, test success, validation |
| Institutional Memory | History, documentation, archive, knowledge base |
| Instantiation Surface | Tool, interface, integration, adapter |
| Architecture Decision Record | Requirement, specification, decision rule |

A prohibited substitution may be used descriptively where the Canonical Term is not intended.

### 18. Abbreviations

An abbreviation may be used normatively only when:

1. it is registered by this document or its Term Owner;
2. it has one unambiguous expansion within the applicable scope;
3. its expansion is established at first use unless the abbreviation is itself canonical.

The following abbreviations are currently registered:

| Abbreviation | Expansion | Status |
|---|---|---|
| ADR | Architecture Decision Record | Permitted Alias |
| AI | Artificial intelligence | Standard abbreviation within an approved Canonical Name |
| API | Application programming interface | Reserved Canonical Name |
| OS | Operating system | Part of the Canonical Name `Atlas OS` |

No other product abbreviation is currently approved.

### 19. Introduction of new Canonical Terms

A Specification Document may introduce a new Canonical Term only when:

1. the concept belongs within that document’s frozen responsibility;
2. no existing Canonical Term adequately identifies the concept;
3. the new term has one precise Term Owner;
4. the Canonical Name and Capitalized Form are declared;
5. likely aliases and collisions are identified;
6. this registry is updated during dependency review.

A new term must not be introduced solely to improve wording.

An implementation-specific label must not replace an existing implementation-independent Canonical Term.

### 20. Terminology conflicts

A terminology conflict exists when:

- one Canonical Name has multiple definitions;
- one concept has multiple unregistered normative names;
- an Alias changes meaning between documents;
- a User-Facing Name alters the underlying concept;
- a Local Definition contradicts or broadens the canonical definition;
- a Reserved Term is defined by a document other than its assigned owner;
- a descriptive term is treated as canonical without registration;
- capitalization causes one term to appear to have multiple meanings.

A terminology conflict must be recorded as an Inconsistency.

The conflict record must identify:

- the affected names;
- the affected concepts;
- the relevant Term Owners;
- the affected Requirements;
- whether the conflict blocks acceptance;
- the documents requiring revision.

This document must not resolve a terminology conflict by inventing architectural semantics.

A conflict affecting normative interpretation blocks acceptance of the affected document.

### 21. Registry maintenance

The Canonical Registry must be reviewed whenever:

- a new Specification Document is authored;
- a Canonical Term is introduced;
- a Canonical Name changes;
- a Term Owner changes;
- an Alias is added, restricted, or deprecated;
- a User-Facing Name is introduced;
- a Local Definition creates a possible collision;
- a terminology conflict is discovered;
- an owning Specification Document is revised.

This document must not change the normative meaning of a term unless its Term Owner has first been revised through the applicable governance process.

A registry revision may align the recorded name, owner, alias, or capitalization with an unchanged owning definition.

## Requirements

**Document Prefix:** `TER`

### Ownership and definitions

**TER-001**  
Every Canonical Term MUST have exactly one Term Owner.

**TER-002**  
A Canonical Term MUST be normatively defined in exactly one Specification Document.

**TER-003**  
A Specification Document that does not own a Canonical Term MUST NOT redefine that term.

**TER-004**  
The normative meaning of a Canonical Term MUST be determined by its Term Owner.

**TER-005**  
This document MUST record definitions owned by other documents by reference rather than duplicating them.

### Names and capitalization

**TER-006**  
Every Canonical Term MUST have one Canonical Name.

**TER-007**  
Every Canonical Term MUST have one Capitalized Form.

**TER-008**  
Normative text MUST use the Capitalized Form when interpretation depends on the specialized Atlas OS concept.

**TER-009**  
Lowercase use of words that also appear in Canonical Terms MUST be treated as descriptive unless the Canonical Term is explicitly referenced.

**TER-010**  
Plural and possessive forms MUST preserve canonical capitalization.

**TER-011**  
Capitalization MUST NOT independently determine whether a statement is normative.

### Product naming

**TER-012**  
`Atlas OS` MUST be the Canonical Name of the product.

**TER-013**  
Normative Requirements referring to the complete product MUST use `Atlas OS`.

**TER-014**  
`Atlas` MAY be used only as the permitted Alias defined by this document.

**TER-015**  
`Atlas` and `Atlas OS` MUST NOT be interpreted as separate products.

**TER-016**  
`Atlas Operating System` and `AOS` MUST NOT be used as normative product names.

### Naming precedence

**TER-017**  
Naming Precedence MUST follow this order: Canonical Name, required Qualified Term, valid Local Definition, mapped User-Facing Name, permitted Alias, Descriptive Label.

**TER-018**  
A lower-precedence name MUST NOT alter the meaning established by a higher-precedence name.

**TER-019**  
Naming Precedence MUST NOT be used to merge distinct concepts.

**TER-020**  
A Qualified Term MUST be used where a Bare Term would create ambiguity.

### Aliases and user-facing names

**TER-021**  
An Alias MUST be explicitly registered before it is used normatively.

**TER-022**  
An Alias MUST preserve the identity, meaning, scope, ownership, and conformance obligations of its Canonical Term.

**TER-023**  
An Alias MUST NOT create independent semantics.

**TER-024**  
A Deprecated Alias MUST NOT be introduced in new normative text.

**TER-025**  
A User-Facing Name MUST be explicitly mapped to a Canonical Term.

**TER-026**  
A User-Facing Name MUST NOT change the identity, meaning, ownership, lifecycle, or conformance obligations of its Canonical Term.

**TER-027**  
Where a User-Facing Name conflicts with a Canonical Name, the Canonical Name MUST govern interpretation.

### Reserved terms

**TER-028**  
A Reserved Term MUST NOT acquire normative semantics before its assigned Term Owner defines it.

**TER-029**  
A Specification Document MUST NOT define a Reserved Term assigned to another Term Owner.

**TER-030**  
Reservation of a term MUST assign naming ownership only and MUST NOT establish architectural behavior.

**TER-031**  
A future Term Owner MAY select a different Canonical Name, but the change MUST be reflected explicitly in this registry.

### Synonyms and abbreviations

**TER-032**  
Competing normative synonyms for one concept MUST NOT be used unless one name is registered as an Alias.

**TER-033**  
A descriptive term MUST NOT be treated as a normative synonym without explicit registration.

**TER-034**  
A shorter term MUST NOT replace a Canonical Name when the replacement removes a required distinction.

**TER-035**  
An abbreviation MUST NOT be used normatively unless it is registered and unambiguous.

### Local definitions and new terms

**TER-036**  
A Local Definition MUST identify its scope and relationship to the canonical definition.

**TER-037**  
A Local Definition MUST NOT contradict, broaden, or replace its Canonical Term.

**TER-038**  
A new Canonical Term MUST belong within the responsibility of its Term Owner.

**TER-039**  
A new Canonical Term MUST NOT be introduced when an existing Canonical Term adequately identifies the concept.

**TER-040**  
An implementation-specific label MUST NOT replace an existing implementation-independent Canonical Term.

### Conflict handling and maintenance

**TER-041**  
A terminology conflict MUST be recorded as an Inconsistency.

**TER-042**  
A terminology conflict affecting normative interpretation MUST block acceptance of the affected document.

**TER-043**  
This document MUST NOT resolve a terminology conflict by inventing architectural semantics.

**TER-044**  
The Canonical Registry MUST be reviewed whenever a new Specification Document or Canonical Term is introduced.

**TER-045**  
This document MUST NOT change the meaning of a Canonical Term unless its Term Owner has first been revised through the applicable governance process.

**TER-046**  
This document MUST undergo dependency review after `05-design-principles.md`, `10-kernel.md`, `20-service-architecture.md`, and `30-interaction-model.md` are authored.

### Kernel Change ownership

**TER-047**  
`Change` MUST be a Canonical Term owned by `10-kernel.md`.

**TER-048**  
The normative meaning of `Change` MUST be determined exclusively by `10-kernel.md`.

**TER-049**  
Kernel `Change` and mission-level `Engineering Change` MUST remain distinct Canonical Terms.

**TER-050**  
`Change` MUST NOT be used as shorthand or a normative synonym for `Engineering Change`, and `Engineering Change` MUST NOT be used as shorthand or a normative synonym for `Change`.

## Non-goals

This document does not define:

1. The mission of Atlas OS.
2. Design Principles.
3. Kernel primitives.
4. The meaning of `System`.
5. The meaning of `State`.
6. The meaning of `Change`.
7. Service responsibilities.
8. Service boundaries.
9. The Interaction Model.
10. The meaning of `Project`, `Product`, `User`, `Current Reality`, or `Current Context`.
11. Protocol behavior.
12. Engineering Change lifecycle states.
13. Governance behavior.
14. Authority or Authorization semantics.
15. Engineering review behavior.
16. Validation or Assurance semantics.
17. Claims or Evidence.
18. Context or Workspace behavior.
19. Integration or Adapter behavior.
20. API semantics.
21. Persistence semantics.
22. Security or Trust semantics.
23. Failure or Recovery semantics.
24. Conformance or Compatibility semantics.
25. Runtime entities.
26. Runtime relationships.
27. Runtime ownership.
28. Runtime states.
29. Runtime transitions.
30. Implementation class names.
31. Database names.
32. Repository names.
33. User-interface copy beyond terminology mappings.
34. A general dictionary of software-engineering vocabulary.
35. Rewording accepted definitions solely for stylistic improvement.

## Open Questions

### OQ-1: Dependency-order inconsistency

The frozen Specification Architecture declares that this document depends on `30-interaction-model.md`, which has not yet been authored.

This Draft may reserve names and record existing accepted terminology, but it cannot become Accepted until its remaining declared dependency has been authored and reviewed.

### OQ-2: Bare Review ownership

`00-specification-governance.md` owns Bare `Review` as a specification-governance term.

`42-review-and-governance.md` may require terminology for runtime engineering review.

Until an explicit revision changes ownership, runtime specifications must use a Qualified Term such as `Engineering Review`.

### OQ-3: Reserved-term finalization

Reserved Terms assigned to unauthored Specification Documents may be retained, replaced, qualified, or rejected by their assigned Term Owners.

The Kernel and Service terms introduced by `10-kernel.md` Version 0.2 Draft and `20-service-architecture.md` Version 0.2 Draft are registered as Defined in Draft.

The final status of the remaining Reserved Terms cannot be determined until their owning documents are authored.

## Future Considerations

Future versions of this document may define:

1. A machine-readable Canonical Registry.
2. Stable identifiers for Canonical Terms.
3. Automated detection of undefined Capitalized Terms.
4. Automated detection of unregistered aliases.
5. Automated detection of prohibited synonym substitution.
6. Automated detection of ambiguous Bare Terms.
7. Automated links between Canonical Terms and Term Owners.
8. A formal alias-deprecation process.
9. A machine-readable registry of User-Facing Name mappings.
10. Automated terminology impact reports for specification revisions.
