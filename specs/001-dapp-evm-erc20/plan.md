
# Implementation Plan: Token Creator DApp

**Branch**: `001-dapp-evm-erc20` | **Date**: 2025-09-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-dapp-evm-erc20/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Create a comprehensive Token Creator DApp supporting multi-chain deployment (ETH, BSC, XSC) with advanced ERC20 features (mintable, burnable, pausable) through an upgradeable factory contract system. Technical approach: Next.js frontend with viem+wagmi for Web3 integration, Foundry-based smart contracts with OpenZeppelin proxy patterns.

## Technical Context
**Language/Version**: TypeScript 5.0+, Solidity ^0.8.20+, Node.js 18+
**Primary Dependencies**: viem, wagmi, Next.js 15+, Foundry, OpenZeppelin Contracts
**Storage**: Browser localStorage for user preferences, blockchain for contract state
**Testing**: Vitest (frontend), Foundry Test Suite (contracts), Playwright (E2E)
**Target Platform**: Modern web browsers with Web3 wallet support
**Project Type**: web - frontend + smart contracts structure
**Performance Goals**: <100ms UI interactions, <2s page loads, <200ms transaction confirmations
**Constraints**: <100MB memory usage, XSC Shanghai-pre EVM compatibility, multi-chain support
**Scale/Scope**: 10k+ concurrent users, support 3 blockchain networks, 50+ UI screens

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality First ✅
- TypeScript strict mode ensures type safety and maintainability
- ESLint + Prettier for consistent code style
- Clear separation: frontend (Next.js) + contracts (Foundry)
- Descriptive naming conventions for components and contracts

### II. Test-Driven Development (NON-NEGOTIABLE) ✅
- Vitest for frontend unit/integration tests (target 90% coverage)
- Foundry Test Suite for comprehensive contract testing
- Playwright for E2E user scenarios
- TDD workflow: Write tests → Fail → Implement → Pass

### III. User Experience Consistency ✅
- Consistent design system with Radix UI + TailwindCSS
- WCAG 2.1 AA compliance for accessibility
- Responsive design for all device sizes
- Clear error messages and loading states

### IV. Performance Standards ✅
- UI interactions <100ms (React optimizations)
- Page loads <2s (Next.js optimization)
- Transaction confirmations <200ms (viem efficiency)
- Memory usage <100MB (optimization monitoring)

### V. Observability & Monitoring ✅
- Structured logging for Web3 transactions
- Error tracking for wallet connection failures
- Performance monitoring for blockchain interactions
- Debug information for contract deployment issues

**Status**: PASS - All constitutional requirements satisfied

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
frontend/
├── src/
│   ├── components/           # React UI components
│   │   ├── ui/              # Base UI components (Radix)
│   │   ├── features/        # Feature-specific components
│   │   └── layout/          # Layout components
│   ├── pages/               # Next.js pages
│   ├── hooks/               # Custom React hooks (wagmi)
│   ├── lib/                 # Utilities and configurations
│   │   ├── wagmi.ts        # Wagmi configuration
│   │   ├── viem.ts         # Viem clients
│   │   └── utils.ts        # Helper functions
│   ├── stores/              # Zustand state management
│   └── types/               # TypeScript type definitions
├── tests/
│   ├── components/          # Component tests (Vitest)
│   ├── hooks/              # Hook tests
│   ├── integration/        # Integration tests
│   └── e2e/               # End-to-end tests (Playwright)
└── public/                 # Static assets

contracts/
├── src/                    # Smart contracts
│   ├── TokenFactory.sol   # Main factory contract
│   ├── ERC20Template.sol  # Token template contract
│   └── interfaces/        # Contract interfaces
├── test/                  # Contract tests (Foundry)
├── script/                # Deployment scripts
└── lib/                   # Contract dependencies
```

**Structure Decision**: Web application structure selected based on frontend + smart contracts pattern. Frontend uses modern Next.js architecture with clear separation of concerns. Contracts follow Foundry conventions for maintainable smart contract development.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts/, data-model.md, quickstart.md)
- **Contract Tasks**: TokenFactory.sol + ERC20Template.sol → test files → implementations
- **Frontend Tasks**: Data models → Wagmi hooks → UI components → page integration
- **Infrastructure Tasks**: Environment setup → deployment scripts → CI/CD pipeline
- **Testing Tasks**: Unit tests → integration tests → E2E scenarios
- Follow TDD: Write test → Make it fail → Implement → Make it pass

**Ordering Strategy**:
1. **Setup Phase**: Environment, dependencies, basic structure [P]
2. **Contract Development**: Factory interface → Template interface → Tests → Implementation [Sequential]
3. **Frontend Foundation**: Data models → Wagmi configuration → State management [P]
4. **UI Components**: Basic components → Forms → Advanced features [Sequential]
5. **Integration**: Page assembly → Wallet connection → Multi-chain support [Sequential]
6. **Validation**: E2E tests → Performance tests → Security validation [P]

**Parallel Execution Markers [P]**:
- Independent contract tests can run in parallel
- UI component development (after data models ready)
- Test file creation (unit tests, integration tests)
- Environment configuration tasks

**Estimated Output**: 28-32 numbered, dependency-ordered tasks in tasks.md

**Key Design Artifacts to Process**:
- `contracts/ITokenFactory.md` → Factory contract + tests (4-5 tasks)
- `contracts/IERC20Template.md` → Template contract + tests (4-5 tasks)
- `data-model.md` → TypeScript interfaces + validation (3-4 tasks)
- `quickstart.md` → Environment setup + deployment (2-3 tasks)
- Multi-chain support from spec.md → Network configuration (2-3 tasks)
- Advanced features → Comprehensive testing scenarios (4-5 tasks)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) → research.md created
- [x] Phase 1: Design complete (/plan command) → data-model.md, contracts/, quickstart.md created
- [x] Phase 2: Task planning complete (/plan command - describe approach only) → Strategy documented
- [ ] Phase 3: Tasks generated (/tasks command) → Ready for /tasks execution
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS → All 5 principles met
- [x] Post-Design Constitution Check: PASS → Re-verified after Phase 1 design
- [x] All NEEDS CLARIFICATION resolved → No outstanding clarifications
- [x] Agent context updated → Claude agent-specific files updated
- [x] Complexity deviations documented → None identified

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
