'use client';

function LogoutButton() {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await fetch('/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <form 
        className="flex flex-col items-center 
            border border-gray-300 p-4 
            hover:scale-110 
            transition-transform duration-150 
            ease-in-out active:scale-95 cursor-pointer" 
        onSubmit={handleSubmit}>
        <button className="cursor-pointer">
            Logout
        </button>
    </form>
  )
}

export default LogoutButton