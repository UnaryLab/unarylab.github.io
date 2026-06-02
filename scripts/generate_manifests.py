#!/usr/bin/env python3
"""Generate the client-side asset manifest for the static site.

Runs in CI on every deploy (see .github/workflows) and can also be run locally
after adding files, so a local preview resolves assets the same way the
deployed site does:

    python3 scripts/generate_manifests.py

Output: data/file_manifest.json, a single object keyed by directory:
  - publication / headshot / software : flat file listings, so pages resolve
        assets by case-insensitive lookup instead of probing with HEAD requests.
  - photo / pet : folders + their image files, for the Photo page and the
        home-page Normy carousel.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'}


def _real(name):
    """Skip dotfiles (.DS_Store, .gitkeep, ...)."""
    return not name.startswith('.')


def folder_manifest(base, sort_key=None):
    """List immediate subfolders of `base`, each with its image files."""
    abspath = os.path.join(ROOT, base)
    if not os.path.isdir(abspath):
        return []
    result = []
    for folder in sorted(os.listdir(abspath), key=sort_key):
        path = os.path.join(abspath, folder)
        if not os.path.isdir(path):
            continue
        files = sorted(
            f for f in os.listdir(path)
            if _real(f) and os.path.splitext(f)[1].lower() in IMAGE_EXTS
        )
        result.append({'folder': folder, 'files': files})
    return result


def flat_manifest(base):
    """List files directly inside `base` (non-recursive)."""
    abspath = os.path.join(ROOT, base)
    if not os.path.isdir(abspath):
        return []
    return sorted(
        f for f in os.listdir(abspath)
        if _real(f) and os.path.isfile(os.path.join(abspath, f))
    )


def write(rel_path, data):
    with open(os.path.join(ROOT, rel_path), 'w') as f:
        json.dump(data, f, indent=2)
        f.write('\n')
    print(f'wrote {rel_path}')


def main():
    write('data/file_manifest.json', {
        'publication': flat_manifest('file/publication'),
        'headshot': flat_manifest('file/headshot'),
        'software': flat_manifest('file/software'),
        'photo': folder_manifest('file/photo'),
        'pet': folder_manifest('file/pet', sort_key=lambda f: f.split('---')[0].lower()),
    })


if __name__ == '__main__':
    main()
