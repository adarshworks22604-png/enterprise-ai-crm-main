import http from "k6/http";
import { check, sleep, fail } from "k6";

// Run:  k6 run load-tests/k6-crm-loadtest.js
// Override target:  k6 run -e BASE=http://localhost:8080 load-tests/k6-crm-loadtest.js
// 127.0.0.1 is the default because "localhost" can resolve to IPv6 and hit a different process.
const BASE = __ENV.BASE || "http://127.0.0.1:8080";

export const options = {
    stages: [
        { duration: "30s", target: 20 },   // warm up
        { duration: "1m", target: 100 },   // ramp
        { duration: "2m", target: 200 },   // sustained load
        { duration: "30s", target: 0 },    // ramp down
    ],
    thresholds: {
        http_req_failed: ["rate<0.01"],     // <1% errors
        http_req_duration: ["p(95)<500"],   // 95% of requests under 500 ms
    },
};

// Finds the JWT anywhere in the login response, whether it is wrapped
// (e.g. { data: { token: "..." } }) or not, and whatever the field is called.
function findToken(obj) {
    if (!obj || typeof obj !== "object") return null;
    for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === "string" && val.startsWith("eyJ")) return val; // JWTs start with "eyJ"
        if (val && typeof val === "object") {
            const found = findToken(val);
            if (found) return found;
        }
    }
    return null;
}

// Log in once; every virtual user reuses the JWT.
export function setup() {
    const res = http.post(
        `${BASE}/api/v1/auth/login`,
        JSON.stringify({ username: "admin", password: "AdminPassword123!" }),
        { headers: { "Content-Type": "application/json" } }
    );

    if (res.status !== 200) {
        fail(`Login failed with status ${res.status}. Response: ${res.body}`);
    }

    const token = findToken(res.json());
    if (!token) {
        fail(`No JWT found in login response: ${res.body}`);
    }
    return { token };
}

export default function (data) {
    const headers = {
        Authorization: `Bearer ${data.token}`,
        "Content-Type": "application/json",
    };

    const health = http.get(`${BASE}/actuator/health`);
    check(health, { "health 200": (r) => r.status === 200 });

    // Read-heavy endpoints (add one request per GET endpoint you want covered)
    const customers = http.get(`${BASE}/api/v1/customers?page=0&size=20`, { headers });
    check(customers, { "customers 200": (r) => r.status === 200 });

    // Write endpoint example: adjust the body to match your Swagger schema.
    // const created = http.post(`${BASE}/api/v1/customers`,
    //   JSON.stringify({ name: `load-${__VU}-${__ITER}`, email: `load-${__VU}-${__ITER}@example.com`, city: "Delhi", totalSpend: 5000 }),
    //   { headers });
    // check(created, { "customer 201": (r) => r.status === 201 });

    sleep(1);
}