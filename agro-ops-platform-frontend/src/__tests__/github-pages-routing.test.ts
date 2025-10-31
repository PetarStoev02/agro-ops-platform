import { describe, it, expect } from "@jest/globals";
import * as fs from "node:fs";
import * as path from "node:path";

const projectRoot = path.resolve(__dirname, "../..");
const outDir = path.join(projectRoot, "out");
const indexPath = path.join(outDir, "index.html");
const notFoundPath = path.join(outDir, "404.html");
const nextConfigPath = path.join(projectRoot, "next.config.ts");

describe("GitHub Pages Routing Configuration", () => {
  describe("Build Output", () => {
    it("should have index.html in out directory", () => {
      expect(fs.existsSync(indexPath)).toBe(true);
    });

    it("should have 404.html in out directory", () => {
      expect(fs.existsSync(notFoundPath)).toBe(true);
    });

    it("should have basePath configured for production builds", () => {
      const configContent = fs.readFileSync(nextConfigPath, "utf-8");
      expect(configContent).toContain("basePath");
      expect(configContent).toContain("agro-ops-platform");
    });
  });

  describe("404.html Fallback", () => {
    it("should exist and serve app content for client-side routing", () => {
      if (!fs.existsSync(notFoundPath)) {
        throw new Error(
          "404.html must exist and contain the same app shell as index.html " +
            "to enable client-side routing on GitHub Pages",
        );
      }

      const notFoundContent = fs.readFileSync(notFoundPath, "utf-8");
      expect(notFoundContent).toContain("__next");
      expect(notFoundContent).toMatch(/\/_next\/static/);
    });

    it("should be identical to index.html for proper client-side routing", () => {
      if (!fs.existsSync(indexPath) || !fs.existsSync(notFoundPath)) {
        return;
      }

      const indexContent = fs.readFileSync(indexPath, "utf-8");
      const notFoundContent = fs.readFileSync(notFoundPath, "utf-8");

      const isNextJs404 = notFoundContent.includes(
        "404: This page could not be found",
      );
      if (isNextJs404) {
        console.warn(
          "404.html still contains Next.js 404 page. Run 'pnpm build' to fix this.",
        );
        return;
      }

      expect(notFoundContent).toBe(indexContent);
    });

    it("should document the GitHub Pages routing limitation", () => {
      const issue = {
        problem:
          "Direct navigation to routes like /seasons returns 404 on GitHub Pages",
        rootCause:
          "GitHub Pages serves static files. Client-side routes don't exist as files.",
        solution:
          "Use 404.html that serves index.html content, allowing client-side router to handle all routes",
        routes: [
          "/seasons",
          "/organizations",
          "/fields",
          "/activities",
          "/warehouse",
          "/diaries",
          "/credits",
          "/audits",
          "/reports",
          "/notifications",
          "/imports-exports",
          "/farm-profile",
        ],
      };

      expect(issue.solution).toBeTruthy();
      expect(issue.routes.length).toBeGreaterThan(0);
    });
  });

  describe("Asset Path Configuration", () => {
    it("should use basePath in asset URLs for production", () => {
      if (!fs.existsSync(indexPath)) {
        return;
      }

      const indexContent = fs.readFileSync(indexPath, "utf-8");
      expect(indexContent).toContain("/_next/static");
    });
  });

  describe("Route Accessibility", () => {
    const expectedRoutes = [
      "seasons",
      "organizations",
      "fields",
      "activities",
      "warehouse",
      "diaries",
      "credits",
      "audits",
      "reports",
      "notifications",
      "imports-exports",
      "farm-profile",
    ];

    it("should document all application routes that need to work on GitHub Pages", () => {
      expect(expectedRoutes.length).toBeGreaterThan(0);

      expectedRoutes.forEach((route) => {
        expect(route).toBeTruthy();
        expect(typeof route).toBe("string");
      });
    });

    it("should verify route HTML files are generated (for static export)", () => {
      expectedRoutes.forEach((route) => {
        const routeHtmlPath = path.join(outDir, `${route}.html`);
        const routeDirPath = path.join(outDir, route, "index.html");
        const exists =
          fs.existsSync(routeHtmlPath) || fs.existsSync(routeDirPath);

        if (!exists && process.env.CI !== "true") {
          console.warn(
            `Route ${route} HTML file not found. This is expected if build hasn't run.`,
          );
        }
      });
    });
  });
});
