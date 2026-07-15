# Atlas OS

The canonical specification for Atlas OS, a microkernel operating system for coherent software evolution.

## Purpose

This repository contains the **normative specification** for Atlas OS. It is the
canonical source of truth for the Atlas OS architecture.

It contains **no implementation code**. Everything here is specification,
governance, decision history, and supporting documentation.

## Repository Structure

| Path              | Contents                                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| `spec/`           | Normative specification documents.                                       |
| `adr/`            | Architecture Decision Records — the "why" behind accepted decisions.     |
| `docs/`           | Non-normative supporting documentation, guides, and background.          |
| `diagrams/`       | Source and rendered diagrams referenced by the specification.            |
| `release-notes/`  | Per-release notes describing changes to the specification.               |
| `CONSTITUTION.md` | The external Engineering Constitution — engineering principles governing how Atlas OS is designed and maintained; external to the normative specification. |
| `CHANGELOG.md`    | A chronological record of notable changes to this repository.            |
| `LICENSE`         | The license governing use of this specification.                         |

Specification governance — versioning, acceptance, amendment, and supersession
of the normative specification — is owned by
[`spec/00-specification-governance.md`](spec/00-specification-governance.md), not
by the Engineering Constitution.

## Status

This repository is in **bootstrap** stage. The structure is in place; normative
content is pending authoring.
