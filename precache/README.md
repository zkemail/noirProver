# Circuit Pre-cache

Pre-downloads and compiles Noir circuits for the blueprints listed in `blueprints.json` so they are baked into the Docker image, avoiding cold-start compilation on first proof request.

## Usage

```bash
npm run precache                          # pre-cache all blueprints in blueprints.json
npm run precache -- <slug>                # pre-cache one specific blueprint
npm run precache -- --refresh             # re-download and recompile all blueprints
npm run precache -- --refresh <slug>      # re-download and recompile one specific blueprint
npm run precache -- --clear               # remove all cached circuits
npm run precache -- --clear <slug>        # remove one specific cached circuit
npm run precache -- --list                # list all currently cached circuits
npm run precache -- --help                # show this help
```

## Adding a new blueprint

1. Add the slug to `blueprints.json`
2. Run `npm run precache`
3. Commit the new circuit directory under `.cache/circuits/`
4. Rebuild and push the Docker image

## Notes

- Each cached circuit is stored in `.cache/circuits/<blueprint-id>/`
- A `.slug` file inside each directory identifies which blueprint it belongs to
- A `.compiled` marker file records when the circuit was last compiled
- Only `.cache/circuits/` is committed to git — `blueprints/`, `proofs/`, and `working-*` dirs are runtime-only and gitignored
