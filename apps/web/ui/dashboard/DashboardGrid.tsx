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
          <div className="col-span-1 sm:col-span-1 lg:col-span-1 bg-red-500 min-h-[100px]">
            Total Questions
          </div>
          <div className="col-span-1 sm:col-span-1 lg:col-span-1 bg-green-500 min-h-[100px]">
            Streaks
          </div>
          <div className="col-span-2 sm:col-span-2 lg:col-span-2 row-span-2 min-h-[300px]">
            <ProductionStopwatch />
          </div>
          <div className="col-span-2 sm:col-span-2 lg:col-span-2 bg-yellow-500 min-h-[100px]">
            badges
          </div>

          {/* Location */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1 bg-pink-500 min-h-[150px]">
            leetcode topics
          </div>

          {/* About */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-4 bg-purple-500 min-h-[150px]">
            heatmap
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
