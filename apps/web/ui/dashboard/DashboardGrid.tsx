"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/ui/layout/sidebar/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@trackio/ui";
import ProductionStopwatch from "../timer/ProductionStopwatch";
import Streaks from "../leetcode/Streaks";
import TotalQuestions from "../leetcode/TotalQuestions";
import Badges from "../leetcode/Badges";
import { TopicAnalysis } from "../leetcode/TopicAnalysis";
import LeetCodeHeatmap from "../leetcode/LeetCodeHeatmap";

export default function DashboardWithSidebar() {
  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Profile",
      href: "#",
      icon: (
        <IconUserBolt className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Settings",
      href: "#",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];

  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex w-full flex-1 flex-col md:flex-row h-screen overflow-hidden"
      )}
    >
      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen} animate={false}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* Bottom user profile */}
          <div>
            <SidebarLink
              link={{
                label: "Pratham",
                href: "#",
                icon: (
                  <img
                    src="https://assets.aceternity.com/manu.png"
                    className="h-7 w-7 shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Dashboard Grid Content */}
      <div className="flex flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-4 w-full">
          {/* Header */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-2 row-span-2 min-h-[300px] bg-gray-400">
            Profile
          </div>

          {/* Socials */}
          <div
            className="col-span-1 sm:col-span-1 lg:col-span-1 
                bg-[#311B12] border rounded-3xl border-[#4d3c33] 
                flex flex-col justify-between items-center p-2"
          >
            <div className="flex justify-center w-full mt-2">
              <TotalQuestions username="PrathamSingh07" />
            </div>
            <div className="text-[#b15f36] flex flex-col text-sm font-light font-mono text-center">
              <div>Total</div>
              <div>Questions</div>
            </div>
          </div>
          <div className="col-span-1 sm:col-span-1 lg:col-span-1 border border-[#2967A7] bg-[#01274A] rounded-3xl flex flex-col justify-between gap-4 items-center p-2">
            <div className="flex justify-center w-full mt-2">
              <Streaks username="PrathamSingh07" />
            </div>
            <div className="flex flex-col text-sm font-light font-mono text-center text-[#84b2df]">
              <div>Max</div>
              <div>Streak</div>
            </div>
          </div>
          <div className="col-span-2 sm:col-span-2 lg:col-span-2 row-span-2 ">
            <ProductionStopwatch />
          </div>
          <div className="col-span-2 sm:col-span-2 lg:col-span-2 border border-[#373737] bg-[#171717] min-h-[220px] flex flex-col justify-center rounded-3xl gap-4 items-center">
            <div>
              <Badges username="leetgoat_dot_dev" />
            </div>
          </div>

          {/* Location */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-4 flex flex-col border border-[#373737] bg-[#171717] rounded-lg shadow-md min-h-[400px] sm:min-h-[350px] overflow-hidden">
            <div className="flex-1 flex flex-col p-4 sm:p-6">
              <TopicAnalysis username="leetgoat_dot_dev" />
            </div>
          </div>

          {/* About */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-2  border border-[#373737] bg-[#171717] min-h-[400px] rounded-lg">
            <div className="flex-1 flex flex-col p-4 sm:p-6 items-center justify-center">
              <LeetCodeHeatmap username="PrathamSingh07" />
            </div>
          </div>

          {/* Email */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-1 bg-indigo-500 min-h-[150px]">
            Coding Projects
          </div>

          <div className="col-span-2 sm:col-span-1 lg:col-span-3 bg-orange-700 min-h-[150px]">
            Todo
          </div>

          <div className="col-span-2 sm:col-span-1 lg:col-span-3 bg-amber-400 min-h-[150px]">
            reminder
          </div>
        </div>
      </div>
    </div>
  );
}

export const Logo = () => (
  <a
    href="#"
    className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
  >
    <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-medium whitespace-pre text-black dark:text-white"
    >
      Trackio
    </motion.span>
  </a>
);

export const LogoIcon = () => (
  <a
    href="#"
    className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
  >
    <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
  </a>
);
