# Manual review

Tag false-positive controls and ambiguous catches.

## v3/isolated — no clean catch (review)
- flawed:    漢字を読むできません。
- corrected: 漢字を読むことができません。
- note:      missing こと nominalizer and が before できる
- flags: 読むできません→読むことができません [particle]
- tag: caught — scorer artifact (pure insertion ⇒ zero-width region ⇒ ambiguous). The model's fix 読むことができません is correct and judge-rated acceptable; counts as a catch. (Class label "particle" is wrong; truth is conjugation.)

## v3/framed — no clean catch (review)
- flawed:    漢字を読むできません。
- corrected: 漢字を読むことができません。
- note:      missing こと nominalizer and が before できる
- flags: 読むできません→読むことができません [particle]
- tag: caught — scorer artifact (pure insertion ⇒ zero-width region ⇒ ambiguous). The model's fix 読むことができません is correct and judge-rated acceptable; counts as a catch. (Class label "particle" is wrong; truth is conjugation.)

