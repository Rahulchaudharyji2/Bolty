"use client"
import React, { useState } from 'react'
import{Button} from "./ui/button"
import {  Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import {ModeToggle} from "./darkToggle"
import Sidebar from "./app-sidebar";
function navbar() {
    const [open, setOpen] = useState(false);

  return (
    <>
    <Sidebar open={open} setOpen={setOpen} />
    <div className='w-full h-16  flex items-center justify-between px-4'>
        <div
          className="text-4xl cursor-pointer"
          onClick={() => setOpen(true)}
        > Bolty</div>
        
        <header className="flex justify-end items-center p-4 gap-4 h-16">
                <ModeToggle />
            <Show when="signed-out">
              <SignInButton />
              <SignUpButton>
                <button className="bg-black text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                  Sign Up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
        
    </div>
    </>
  )
}

export default navbar