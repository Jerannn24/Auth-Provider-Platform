'use client';

function LoginButton() {
  return (
    <form 
        className="flex flex-col items-center 
            border border-gray-300 p-4 
            hover:scale-110 
            transition-transform duration-150 
            ease-in-out active:scale-95 cursor-pointer" 
        action="/auth/login">
        <button className="cursor-pointer">
            Login
        </button>
    </form>
  )
}

export default LoginButton