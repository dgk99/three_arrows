# 배포 가이드 (프로덕션 서버)

로컬 개발 환경(macOS + 수동 postgres)과 서버 환경의 차이를 정리한 문서입니다. 서버 컴퓨터에서 이 저장소를 `git clone` 받은 뒤 아래 순서대로 진행하면 됩니다.

## 사전 준비 (서버에 설치되어 있어야 하는 것)

- Node.js (v20 이상 권장)
- PostgreSQL (RDS든 서버에 직접 설치한 것이든 무관, 접속 가능한 주소만 있으면 됨)
- nginx (또는 다른 리버스 프록시) — 프론트엔드 정적 파일과 백엔드 API를 같은 도메인/포트로 묶어서 서빙하기 위함
- (선택) `pm2` 같은 Node 프로세스 매니저 — 백엔드를 상시 구동시키기 위함

## 1. 클론 & 의존성 설치

```bash
git clone https://github.com/dgk99/three_arrows.git
cd three_arrows
cd backend && npm install
cd ../frontend && npm install
```

## 2. 데이터베이스 준비

```bash
# DB가 없다면 생성 (postgres 접속 가능한 계정으로)
createdb planly

# 스키마 적용 (몇 번을 실행해도 안전하게 설계되어 있음 — CREATE TABLE IF NOT EXISTS)
psql -d planly -f backend/src/db/schema.sql
```
RDS를 쓴다면 `createdb` 대신 RDS 콘솔/CLI로 DB를 만들고, `psql`의 `-h`/`-U` 등으로 접속 정보를 지정하면 됩니다.

## 3. 백엔드 환경변수

`backend/.env.example`을 참고해서 `backend/.env`를 서버에 직접 만듭니다 (이 파일은 git에 올라가지 않음 — 절대 커밋하지 마세요).

```bash
cd backend
cp .env.example .env
```

`.env` 내용을 실제 값으로 채웁니다:

```
PORT=4000
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/planly
ANTHROPIC_API_KEY=sk-ant-...   # 본인 Anthropic API 키
```

## 4. 백엔드 빌드 & 실행

```bash
cd backend
npm run build          # tsc로 dist/ 생성
npm start              # node dist/index.js (포그라운드)
```

상시 구동을 위해서는 `pm2` 사용을 권장합니다:

```bash
npm install -g pm2
pm2 start dist/index.js --name planly-backend
pm2 save
pm2 startup            # 서버 재부팅 시 자동 시작 설정 (안내에 따라 한 번 더 실행)
```

**업로드 파일 주의**: 사진/첨부파일은 `backend/uploads/`에 실제로 저장됩니다(`.gitignore`에 포함되어 git에는 안 올라감). 서버를 재배포하거나 인스턴스를 교체할 때 이 디렉터리가 지워지지 않도록 별도 볼륨/백업을 고려하세요. (현재는 EC2 로컬 디스크 저장 — 나중에 S3로 옮길지는 README의 "아직 정해지지 않은 것" 참고)

## 5. 프론트엔드 빌드

```bash
cd frontend
npm run build     # frontend/.env.production (VITE_API_URL=/api) 이 자동 적용됨
```
`frontend/dist/`에 정적 파일이 생성됩니다. 이 디렉터리를 nginx가 서빙하게 합니다.

## 6. nginx 리버스 프록시 설정 예시

프론트엔드(`frontend/.env.production`의 `VITE_API_URL=/api`)는 **프론트와 백엔드가 같은 도메인**에서 서빙된다고 가정합니다. 즉 nginx가 정적 파일은 직접 서빙하고, `/api`와 `/uploads`는 백엔드(포트 4000)로 넘겨줘야 합니다.

```nginx
server {
    listen 80;
    server_name your-domain-or-ip;

    root /path/to/three_arrows/frontend/dist;
    index index.html;

    # SPA 라우팅: 실제 파일이 없으면 index.html로
    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads/ {
        proxy_pass http://localhost:4000;
    }
}
```

## 7. 배포 후 확인

```bash
curl http://localhost:4000/health          # 백엔드 자체 확인
curl http://your-domain-or-ip/api/entries  # nginx 경유 확인
```
브라우저로 접속해서 체크리스트/플랜 화면과 AI 비서, 언어 토글이 정상 동작하는지 확인하세요.

## 이후 업데이트 배포 시

```bash
git pull
cd backend && npm install && npm run build && pm2 restart planly-backend
cd ../frontend && npm install && npm run build   # nginx는 정적 파일을 다시 읽으므로 재시작 불필요
```
DB 스키마가 바뀌었다면 `psql -d planly -f backend/src/db/schema.sql`도 다시 실행하세요 (기존 테이블/컬럼은 건드리지 않고 새로 추가된 것만 생성됩니다 — 컬럼 추가처럼 `ALTER TABLE`이 필요한 변경은 schema.sql에 자동 반영되지 않으니 마이그레이션 이력을 확인하세요).
