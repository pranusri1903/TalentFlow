import { useState } from 'react'
import { Link } from 'react-router-dom'

import AuthLayout from '../components/AuthLayout'
import { supabase } from '../lib/supabase'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) setError(error.message)
    else setDone(true)
    setLoading(false)
  }

  const handleGoogle = () => {
    supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  if (done) {
    return (
      <AuthLayout title="Check your email">
        <p className="text-slate-600 text-sm">
          We sent a verification link to <b>{email}</b>. Click it, then come back and sign in.
        </p>
        <Link to="/login" className="block text-center mt-6 text-indigo-600 font-medium">
          Back to sign in
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Create your account" subtitle="Find your next role with TalentFlow">
      <button
        onClick={handleGoogle}
        className="w-full border border-slate-300 rounded-lg py-2.5 font-medium text-slate-700 hover:bg-slate-50 mb-4"
      >
        Continue with Google
      </button>

      <div className="flex items-center gap-3 my-4 text-xs text-slate-400">
        <div className="flex-1 h-px bg-slate-200" />
        OR
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-lg py-2.5 font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-slate-500 mt-6 text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
