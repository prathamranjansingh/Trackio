"use client"

import Link from "next/link"
import { Button } from "@trackio/ui"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 text-center px-6 py-20">
        <h1 className="text-5xl font-bold mb-6">
          Welcome to <span className="text-blue-600">YourApp</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mb-8">
          Build, manage, and scale your projects with ease. 
          Sign up to access your personalized dashboard.
        </p>
        <div className="flex gap-4">
          <Link href="/signup">
            <Button size="lg" variant="default" className="">Get Started</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="">
              Log In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-10 py-16 bg-gray-50">
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Feature One</h3>
          <p className="text-gray-600">
            Describe your app’s first amazing feature here.
          </p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Feature Two</h3>
          <p className="text-gray-600">
            Another key highlight of your platform.
          </p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Feature Three</h3>
          <p className="text-gray-600">
            Showcase why users should choose your product.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500 text-sm">
        © {new Date().getFullYear()} YourApp. All rights reserved.
      </footer>
    </div>
  )
}
