# Changelog

Every change that ships in Devis 3 minutes, newest first. The project has no version file: the version lives
here only.

## [0.1.0] - 2026-11-28

### Fixed

- A release of main keeps serving once the visitors are on it: no setting the service carries can stop the
  quote page from answering any more (US1). Nothing a visitor sees changes.

### Security

- The repository refuses an env file: `.env` and every `.env*` file are ignored, except `.env.example` (US2).
- Every pull request, and every change of main, has its new commits read for keys: a key in one of them fails
  the checks, and its value is never printed (US2).

### Added

- Every pull request, and every change of main, runs the project's own tests (`tests/calc.test.js`,
  `tests/depot.test.js`). The browser tests (`tests/page.js`, `tests/trajet.js`, `tests/pdf.js`) are left
  out: a bare runner cannot run them (US2).

### Changed

- The pipeline's files are fleet's current standard, with this project's values. Its watch says nothing on a
  service that was never opened to the visitors (US2).
