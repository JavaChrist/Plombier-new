'use client'

import { useState, useEffect } from 'react'
import { db } from '@/config/firebase'
import { collection, addDoc } from 'firebase/firestore'
import emailjs from '@emailjs/browser'

export default function Contact() {
  // Initialisons EmailJS au chargement du composant
  useEffect(() => {
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!)
  }, [])

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    message: '',
    timeSlot: '',
  })

  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUrgentModal, setShowUrgentModal] = useState(false)
  const [pendingSubmission, setPendingSubmission] = useState(false)

  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(() => {
        setStatus({ type: null, message: '' })
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [status.message])

  const getCurrentDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const formatTimeSlot = (timeSlot: string) => {
    const slots = {
      morning: 'Matin (8h-12h)',
      afternoon: 'Après-midi (14h-17h)',
      evening: 'Fin de journée (17h-19h)',
    }
    return slots[timeSlot as keyof typeof slots] || timeSlot
  }

  const formatDateForEmail = (dateString: string) => {
    const [year, month, day] = dateString.split('-')
    return `${day}.${month}.${year}`
  }

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')

    if (numbers.startsWith('33')) {
      return `+${numbers}`
    }

    if (numbers.startsWith('0')) {
      return `+33${numbers.substring(1)}`
    }

    return `+${numbers}`
  }

  const isValidPhoneNumber = (phone: string) => {
    const regex = /^\+33[1-9][0-9]{8}$/
    return regex.test(phone)
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (e.target.name === 'phone') {
      const formattedPhone = formatPhoneNumber(e.target.value)
      setFormData(prev => ({
        ...prev,
        phone: formattedPhone,
      }))

      if (formattedPhone && !isValidPhoneNumber(formattedPhone)) {
        setStatus({
          type: 'error',
          message: 'Numéro de téléphone invalide (format: +33XXXXXXXXX)',
        })
      } else {
        setStatus({ type: null, message: '' })
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [e.target.name]: e.target.value,
      }))
    }
  }

  const submitForm = async () => {
    setIsSubmitting(true)
    try {
      // Ajoutons des logs pour vérifier les variables
      console.log('Service ID:', process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID)
      console.log(
        'Template Admin:',
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_ADMIN
      )
      console.log(
        'Template Client:',
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_CLIENT
      )

      const cleanedData = {
        ...formData,
        phone: formData.phone.replace(/\s/g, ''),
        dateCreation: new Date().toISOString(),
        status: 'nouveau',
        source: 'site_web',
      }

      await addDoc(collection(db, 'rendez-vous'), cleanedData)

      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_ADMIN!,
        {
          from_name: formData.name,
          from_email: formData.email,
          phone: formData.phone,
          message: formData.message,
          date: formatDateForEmail(formData.date),
          time_slot: formatTimeSlot(formData.timeSlot),
          to_email: 'support@javachrist.fr',
        }
      )

      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_CLIENT!,
        {
          to_name: formData.name,
          to_email: formData.email,
          client_name: formData.name,
          appointment_date: formatDateForEmail(formData.date),
          time_slot: formatTimeSlot(formData.timeSlot),
          from_name: 'Plombier Chauffagiste',
          reply_to: 'support@javachrist.fr',
        }
      )

      setStatus({
        type: 'success',
        message: `Demande envoyée avec succès ! Un email de confirmation a été envoyé à ${formData.email}.`,
      })

      setFormData({
        name: '',
        email: '',
        phone: '',
        date: '',
        message: '',
        timeSlot: '',
      })
    } catch (error) {
      console.error('Erreur:', error)
      setStatus({
        type: 'error',
        message: 'Une erreur est survenue. Veuillez réessayer.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUrgentConfirmation = (confirmed: boolean) => {
    setShowUrgentModal(false)
    if (confirmed && pendingSubmission) {
      submitForm()
    }
    setPendingSubmission(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const today = new Date()
    const selectedDate = new Date(formData.date)
    const daysDifference = Math.floor(
      (selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysDifference <= 2) {
      setShowUrgentModal(true)
      setPendingSubmission(true)
      return
    }

    await submitForm()
  }

  return (
    <main className='min-h-screen bg-gradient-to-b from-white to-gray-50 py-8 md:py-16'>
      <div className='container mx-auto max-w-2xl px-4'>
        <h1 className='mb-8 text-center text-3xl font-bold text-blue-600 md:text-4xl'>
          Demande d&apos;intervention
        </h1>

        <form
          onSubmit={handleSubmit}
          className='space-y-6 rounded-xl bg-white p-6 shadow-lg md:p-8'
        >
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div>
              <label
                htmlFor='name'
                className='mb-2 block font-medium text-gray-700'
              >
                Nom complet *
              </label>
              <input
                type='text'
                id='name'
                name='name'
                value={formData.name}
                onChange={handleChange}
                required
                className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label
                htmlFor='email'
                className='mb-2 block font-medium text-gray-700'
              >
                Email *
              </label>
              <input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleChange}
                required
                className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label
                htmlFor='phone'
                className='mb-2 block font-medium text-gray-700'
              >
                Téléphone *
              </label>
              <input
                type='tel'
                id='phone'
                name='phone'
                value={formData.phone}
                onChange={handleChange}
                required
                aria-invalid={status.type === 'error'}
                aria-describedby='phone-error'
                pattern='^\+33[1-9][0-9]{8}$'
                className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500'
              />
              <p className='mt-1 text-sm text-gray-500'>
                Format: +33 pour la France suivi du numéro sans le 0
              </p>
              {status.type === 'error' && (
                <p id='phone-error' className='mt-1 text-sm text-red-500'>
                  {status.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor='date'
                className='mb-2 block font-medium text-gray-700'
              >
                Date souhaitée *
              </label>
              <input
                type='date'
                id='date'
                name='date'
                value={formData.date}
                onChange={handleChange}
                required
                min={getCurrentDate()}
                className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label
                htmlFor='timeSlot'
                className='mb-2 block font-medium text-gray-700'
              >
                Créneau horaire souhaité *
              </label>
              <select
                id='timeSlot'
                name='timeSlot'
                value={formData.timeSlot}
                onChange={handleChange}
                required
                className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>Sélectionnez un créneau</option>
                <option value='morning'>Matin (8h-12h)</option>
                <option value='afternoon'>Après-midi (14h-17h)</option>
                <option value='evening'>Fin de journée (17h-19h)</option>
              </select>
            </div>

            <div className='md:col-span-2'>
              <label
                htmlFor='message'
                className='mb-2 block font-medium text-gray-700'
              >
                Message *
              </label>
              <textarea
                id='message'
                name='message'
                rows={4}
                value={formData.message}
                onChange={handleChange}
                required
                className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>

          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full transform rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:bg-blue-700 disabled:bg-gray-400'
          >
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
          </button>
        </form>

        {status.message && (
          <div
            role='alert'
            aria-live='polite'
            className={`mt-4 transform rounded-lg p-4 transition-all duration-500 ease-in-out ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} ${status.message ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}
          >
            {status.message}
          </div>
        )}

        {showUrgentModal && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
            <div className='w-full max-w-md rounded-lg bg-blue-600 p-6 text-white'>
              <h3 className='mb-4 text-xl font-semibold'>Rendez-vous urgent</h3>
              <p className='mb-6'>
                Vous demandez un rendez-vous dans moins de 48h. Pour les
                urgences, nous vous recommandons de nous appeler directement.
                Voulez-vous quand même envoyer la demande ?
              </p>
              <div className='flex justify-end space-x-4'>
                <button
                  onClick={() => handleUrgentConfirmation(false)}
                  className='rounded-lg bg-white px-4 py-2 text-blue-600 transition-colors hover:bg-gray-100'
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleUrgentConfirmation(true)}
                  className='rounded-lg bg-blue-700 px-4 py-2 text-white transition-colors hover:bg-blue-800'
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
