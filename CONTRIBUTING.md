# Contributing to Sabr Tasbih

We welcome contributions from the Islamic open-source development community. By contributing, you help Muslims around the world maintain their daily remembrance of Allah.

---

## 🛠️ Git Development Workflow

We follow a structured branch strategy:

1.  **`main` Branch:**
    *   Represents stable, production-ready releases.
    *   No direct commits allowed.
2.  **`develop` Branch:**
    *   The primary integration branch for development.
3.  **Feature / Bug Branches:**
    *   Branch out from `develop` using standard naming conventions:
        *   `feature/dhikr-counter-sensory`
        *   `bugfix/hive-migration-error`

### Step-by-Step Feature Workflow

1.  Fork the repository and branch out from `develop`:
    ```bash
    git checkout -b feature/your-feature-name
    ```
2.  Write clean, documented Dart code conforming to `flutter_lints` configurations.
3.  Ensure your code changes contain unit or widget tests:
    ```bash
    flutter test
    ```
4.  Commit your work using **Semantic Commits**:
    *   `feat: Add custom audio mechanical click sound options`
    *   `fix: Resolve timezone offset calculation for Friday reminder`
    *   `docs: Update deployment steps for iOS App Store`
5.  Push your branch and open a Pull Request (PR) against the `develop` branch.

---

## 📌 Pull Request Guidelines

*   Provide a clear description of the feature or bugfix.
*   Link to active issues if applicable.
*   Include screenshots or recordings if modifying UI components.
*   Maintain documentation in [PROJECT_DOCUMENTATION.md](file:///c:/Users/ksham/OneDrive/Desktop/tasbih/PROJECT_DOCUMENTATION.md).

---

## 🏷️ Semantic Versioning

We follow the standard [SemVer](https://semver.org/) schema (`MAJOR.MINOR.PATCH`):
*   **MAJOR:** Significant architectural changes (e.g. database migrations).
*   **MINOR:** New features (e.g. adding the Dhikr Garden gamification system).
*   **PATCH:** Backward-compatible bug fixes (e.g. resolving layout alignment).
