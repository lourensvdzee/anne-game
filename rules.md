# Anne Game Development Rules

## Golden Rules for Claude Assistants

These rules guide all development work on the Anne Game project. Follow them strictly to ensure quality, safety, and consistency.

---

### **Rule #1: Tech Stack**
**Three.js/Vite/Vanilla JS stack**

This project uses:
- Three.js ~0.160.0 for 3D rendering
- Vite ^5.0.0 for build tooling and dev server
- Vanilla JavaScript (ES modules) - no framework
- OBJLoader and MTLLoader for 3D model loading

Work within this stack. Do not introduce new frameworks or major dependencies without explicit approval.

---

### **Rule #2: Structured Workflow**
**Always explain what, why, and how to test**

Before making changes:
1. **What**: Clearly state what you're going to change
2. **Why**: Explain the reason for the change
3. **How to test**: Provide simple steps to verify the change works

Keep explanations simple and avoid jargon. Remember that not all users are full-time developers.

---

### **Rule #3: Git Branching Strategy**
**Use feature branches - NEVER commit directly to `main`**

Branch naming conventions:
- `feature/description` - for new features
- `fix/description` - for bug fixes
- `chore/description` - for maintenance tasks (dependencies, configs, documentation)

Examples:
- `feature/enemy-obstacles`
- `fix/jet-rotation-direction`
- `chore/update-rules-document`

Always create a new branch before making changes. Main branch is protected.

---

### **Rule #4: Pull Request Requirements**
**1 PR = 1 change, with summary + test plan + preview**

Every PR must include:
1. **Summary**: Brief description of what changed and why
2. **Test Plan**: Step-by-step instructions to verify the change (include keyboard and touch testing)
3. **Preview**: Screenshots, recordings, or deployed preview link when applicable

Keep PRs focused on a single logical change. Multiple unrelated changes should be separate PRs.

---

### **Rule #5: Test After Every Change**
**Run dev server and test on both desktop and mobile**

Testing protocol:
1. Ensure `npm run dev` runs without errors
2. Check browser console for errors or warnings
3. Test the specific functionality you modified
4. **Desktop**: Test with keyboard controls (Arrow keys, WASD)
5. **Mobile**: Test with touch controls (drag/swipe)
6. Verify no regressions in related features

If tests fail or errors appear, **stop and debug before proceeding**.

---

### **Rule #6: Keep Changes Small and Reversible**
**Maximum 200 lines per PR, reversible changes only**

Guidelines:
- Prefer small, incremental changes over large refactors
- Each change should be easily reversible via `git revert`
- Break large features into multiple PRs
- If a change exceeds 200 lines, ask for approval to continue

Small changes are easier to review, test, and roll back if needed.

---

### **Rule #7: Debug Methodology**
**Use `console.log` first, ask for help if stuck**

Debugging steps:
1. Add `console.log` statements to trace the issue
2. Check browser console and network tab (especially for asset loading issues)
3. Review error stack traces carefully
4. For 3D issues, use Three.js helpers (AxesHelper, GridHelper) to visualize
5. If stuck after 3 attempts, **ask for guidance** - don't keep trying blindly

Don't waste time guessing. Clear debugging is more efficient than trial and error.

---

### **Rule #8: Commit Message Style**
**Use imperative mood, be specific**

Format: `<type>: <description>`

Good examples:
- `feat: Add hovering effect to jet movement`
- `fix: Correct jet banking direction when turning`
- `chore: Add development rules document`
- `refactor: Extract input handling into separate class`

Bad examples:
- ❌ `Updated files`
- ❌ `fixes`
- ❌ `Added new feature for the game`

Be specific and use imperative mood (Add, Fix, Update, Remove, etc.).

---

### **Rule #9: Safety First**
**No production deploys or major changes without explicit approval**

Requires approval before:
- Deploying to production (build and deploy)
- Major refactoring that affects core game loop or rendering
- Adding new large dependencies or libraries
- Deleting or renaming critical files (game.js, player.js, main.js)
- Large-scale code restructuring (>200 lines)

**STOP and ask if**:
- Tests fail repeatedly
- Errors persist after debugging
- Logic or requirements are unclear
- You're unsure about the approach
- Performance issues arise (low FPS, stuttering)

When in doubt, ask. It's better to clarify than to make incorrect assumptions.

---

### **Rule #10: Game-Specific Guidelines**
**Maintain simplicity and performance**

Game development specifics:
- **Simplicity first**: Start with basic features, iterate based on feedback
- **Performance matters**: Target 60 FPS on both desktop and mobile
- **Mobile-first controls**: Touch controls should feel as good as keyboard
- **Incremental scope**: Add one feature at a time (movement → obstacles → scoring → polish)
- **Visual feedback**: Every interaction should have clear visual response
- **Test on real devices**: Especially mobile touch controls

Keep the game small, focused, and highly polished rather than feature-rich and buggy.

---

## Project Structure Guidelines

```
anne-game/
├── public/          # Static assets (models, textures, sounds)
├── src/             # Source code
│   ├── main.js      # Entry point
│   ├── game.js      # Core game logic and scene
│   ├── player.js    # Player object and controls
│   ├── input.js     # Input handling
│   └── ...          # Other game modules as needed
├── index.html       # HTML shell
└── package.json     # Dependencies
```

When adding new features:
- Create new modules in `src/` for distinct game systems
- Keep files focused on a single responsibility
- Static assets always go in `public/`

---

## Summary

These rules ensure:
- ✅ Quality through structured workflows and testing
- ✅ Safety through small, reversible changes
- ✅ Clarity through clear communication
- ✅ Performance through careful optimization
- ✅ Collaboration through proper git hygiene

Follow these rules on every change, no matter how small.
