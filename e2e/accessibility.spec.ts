import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
for(const path of ["/","/play","/play/celo"]){test(`no serious accessibility violations on ${path}`,async({page})=>{await page.goto(path);const results=await new AxeBuilder({page}).analyze();expect(results.violations.filter((item)=>item.impact==="serious"||item.impact==="critical")).toEqual([]);});}
