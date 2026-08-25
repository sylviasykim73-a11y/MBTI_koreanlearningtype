# Korean Learning Type 🇰🇷

> What's Your Korean Learning Type?

한국 대학에서 하루를 보내며 자신의 한국어 학습 성향을 발견하는 교육용 인터랙티브 웹앱입니다.
24개의 상황별 질문에 답하면 16개의 학습 유형 중 하나와 함께, 실제로 써볼 수 있는 학습법 · 오늘의 미션 · 7일 챌린지를 받습니다.

**공식 MBTI 성격검사가 아닙니다.** 4개 대비 축(E/I, S/N, T/F, J/P)의 형식을 참고했을 뿐, 한국어 학습 행동에 맞게 재해석한 교육용 테스트입니다.

## 실행 방법 (로컬)

별도의 빌드 과정이나 서버가 필요 없는 정적 사이트입니다.

```bash
npx serve .
```

또는 아무 정적 서버로 `index.html`을 열면 바로 실행됩니다. 브라우저에서 파일을 직접 더블클릭해서 열어도 대부분의 기능이 동작합니다(단, 일부 브라우저는 `file://`에서 `sessionStorage`/클립보드 API를 제한할 수 있으므로 로컬 서버 사용을 권장합니다).

## 배포 방법

정적 파일만으로 구성되어 있어 GitHub Pages, Netlify, Vercel, Cloudflare Pages 등 어떤 정적 호스팅에도 그대로 올리면 됩니다.

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

이 저장소에는 [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)이 포함되어 있어, `main` 브랜치에 푸시하면 GitHub Actions가 자동으로 GitHub Pages에 배포합니다. 최초 1회만 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 지정해주세요.

## 프로젝트 구조

```text
korean-learning-type/
├── index.html          모든 화면(Landing, Question, Result 등)의 마크업
├── style.css           K-Campus x Gen-Z 디자인 시스템
├── js/
│   ├── questions.js     24개 문항 + 축별 타이브레이커 문항 데이터
│   ├── profiles.js      16개 학습 유형 프로필 데이터 (강점/주의점/미션/챌린지 등)
│   ├── scoring.js       순수 함수 기반 점수 계산 엔진
│   ├── storage.js       sessionStorage 헬퍼 (닉네임, 효과음 설정만 저장)
│   ├── share.js         Canvas 기반 결과 카드 생성, 저장/공유/링크 복사
│   └── app.js           상태 관리, 화면 전환, 렌더링 로직
├── assets/
│   ├── characters/      캐릭터 이미지(추후 교체용, MVP에서는 이모지 사용)
│   ├── icons/
│   ├── sounds/          (MVP에서는 Web Audio API로 효과음을 실시간 생성하므로 비어 있음)
│   └── branding/        학교 로고 등 브랜딩 자산(제공 시 배치)
└── README.md
```

## 커스터마이징

- **학교 브랜딩**: `js/app.js`의 `SCHOOL_BRAND_NAME`과 `js/share.js`의 `SHARE_BRAND_NAME` 상수를 변경하세요. 빈 문자열로 두면 표시되지 않습니다.
- **문항/유형 콘텐츠**: `js/questions.js`, `js/profiles.js`는 코드 로직과 완전히 분리되어 있어 텍스트만 수정하면 됩니다.
- **다국어 확장**: 모든 콘텐츠 객체가 `ko`/`en` 필드로 구성되어 있어 새 언어(`zh`, `vi` 등)를 추가하기 쉬운 구조입니다.

## 개인정보 및 데이터

- 회원가입/로그인 없음, 서버 없음, 데이터베이스 없음, 외부 AI API 호출 없음
- 닉네임과 효과음 설정만 브라우저 `sessionStorage`에 저장되며, 탭을 닫으면 사라집니다
- 결과나 답변은 어디로도 전송되지 않습니다

## 접근성

- 모든 인터랙션은 키보드로 조작 가능합니다 (Tab/Enter/Space)
- 포커스 표시, 충분한 색상 대비, 색상 외 텍스트 라벨 병행 표시
- `prefers-reduced-motion` 설정 시 애니메이션이 최소화됩니다
- 결과 그래프에는 항상 퍼센트 숫자가 함께 표시됩니다

## 라이선스

[MIT](LICENSE)

## 기능 테스트 체크리스트

- [x] 기본 문항 24개, 각 축 6문항
- [x] Back으로 이전 답변 수정 시 점수 중복 없음 (같은 질문 ID로 덮어쓰기)
- [x] 3:3 동점 감지 및 축별 타이브레이커 정상 작동
- [x] 16개 유형 계산 및 전체 결과 콘텐츠 존재
- [x] PNG 저장(Canvas 기반, 외부 라이브러리 없음) 및 Web Share API, 클립보드 복사 fallback
- [x] 모바일 퍼스트 반응형 레이아웃
