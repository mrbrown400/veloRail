---
name: vr-005-proposal-import-pipeline-plan
---

## decision

Build the import pipeline as a thin layer over the VR-001 TransitProposalDataset schema. Versioned source files must declare schemaVersion 1.0.0, validate through the shared proposal validator, and emit Google Maps-ready polyline and marker bundles through the existing adapter helpers.

## scope

Add import helpers, validation hardening for ids/provenance/versioned datasets, focused tests, and source/provenance documentation. Do not migrate operational TRANSIT_LINES, change routing, add another map provider, or require map components to change for each new proposal record.
