---
lang: ko
originalPath: README.md
---
# Mintlify 시작 키트

시작 키트를 사용하여 문서를 배포하고 사용자 정의할 준비를 하세요.

이 리포지토리 상단에 있는 초록색 **Use this template** 버튼을 클릭하여 Mintlify 시작 키트를 복사하세요. 시작 키트에는 다음 예제가 포함되어 있습니다.

- 가이드 페이지
- 네비게이션
- 사용자 정의
- API 참조 페이지
- 인기 있는 컴포넌트 사용

**[전체 빠른 시작 가이드를 따라하세요](https://starter.mintlify.com/quickstart)**

## 개발

[Mintlify CLI](https://www.npmjs.com/package/mint)를 설치하여 로컬에서 문서 변경 사항을 미리 봅니다. 설치하려면 다음 명령어를 사용하세요:

```
npm i -g mint
```

`docs.json`이 위치한 문서의 루트에서 다음 명령어를 실행하세요:

```
mint dev
```

로컬 미리보기를 `http://localhost:3000`에서 확인하세요.

## 변경 사항 배포하기

[대시보드](https://dashboard.mintlify.com/settings/organization/github-app)에서 GitHub 앱을 설치하여 리포지토리에서 배포로 변경 사항을 전파하세요. 기본 브랜치로 푸시한 후 변경 사항이 자동으로 프로덕션에 배포됩니다.

## 도움이 필요하신가요?

### 문제 해결

- 개발 환경이 실행되지 않는 경우: CLI의 최신 버전을 보유하고 있는지 확인하기 위해 `mint update`를 실행하세요.
- 페이지가 404로 로드되는 경우: 유효한 `docs.json`이 있는 폴더에서 실행되고 있는지 확인하세요.

### 리소스

- [Mintlify 문서](https://mintlify.com/docs)
- [Mintlify 커뮤니티](https://mintlify.com/community)
