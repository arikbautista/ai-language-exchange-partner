# Manual review

Tag false-positive controls and ambiguous catches.

## v3/isolated — no clean catch (review)
- flawed:    漢字を読むできません。
- corrected: 漢字を読むことができません。
- note:      missing こと nominalizer and が before できる
- flags: 読むできません→読めません [conjugation]
- tag: caught — scorer artifact (pure insertion ⇒ zero-width region ⇒ ambiguous). The model's fix 読めません ("can't read kanji", potential form) is correct, natural Japanese and judge-rated acceptable; counts as a catch. Class label "conjugation" is correct.

## v3/framed — no clean catch (review)
- flawed:    漢字を読むできません。
- corrected: 漢字を読むことができません。
- note:      missing こと nominalizer and が before できる
- flags: 読むできません→読むことができません [conjugation]
- tag: caught — scorer artifact (pure insertion ⇒ zero-width region ⇒ ambiguous). The model's fix 読むことができません matches the reference and is judge-rated acceptable; counts as a catch. Class label "conjugation" is correct.
