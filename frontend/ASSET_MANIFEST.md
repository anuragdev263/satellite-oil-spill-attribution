# Asset Manifest

Preview assets live under:

```text
public/data/previews/test/
public/data/previews/validation/
```

Naming convention:

```text
test_rank_01.png
test_rank_02.png
...
test_rank_12.png
validation_rank_01.png
...
validation_rank_12.png
```

The app does not depend on uploaded WhatsApp filenames. Source previews were identified from their visible split/rank metadata and converted into stable PNG paths.

Manifest file:

```text
public/data/candidate_assets.json
```

Manifest shape:

```json
{
  "candidateId": "test:S1A_20190824_r15908_c25536_negative.npz",
  "split": "test",
  "rank": 1,
  "tileName": "S1A_20190824_r15908_c25536_negative.npz",
  "scene": "S1A_20190824",
  "acquisitionDate": "2019-08-24",
  "compositePreviewUrl": "/data/previews/test/test_rank_01.png"
}
```

Duplicate handling:

- Candidate identity is `split + ":" + tileName`.
- The manifest rejects duplicate candidate IDs.
- The manifest rejects duplicate split/rank pairs.
- This source set contains exactly one Validation rank 6 preview in the final manifest.

Missing handling:

- Candidates without previews remain selectable.
- The detail inspector shows an unavailable-preview state.
- Normal Review Mode masks the preview header because it contains ground truth.
- Evaluation Mode shows the original uncropped preview.
