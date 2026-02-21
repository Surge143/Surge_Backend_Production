'use client'

import React, { useState, useEffect } from 'react'
import styles from './profile.module.css'

interface Address {
    id?: string
    label: string
    addressFirstName: string
    addressLastName: string
    street: string
    apartment: string
    city: string
    emirates: string
    country: string
    phoneNumber: string
}

interface UserProfile {
    id: string | number
    email: string
    firstName: string
    lastName: string
    phone: string
    gender: string
    addresses: Address[]
}

export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Form states
    const [personalInfo, setPersonalInfo] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        gender: ''
    })
    const [addresses, setAddresses] = useState<Address[]>([])

    // Modal state for adding/editing addresses
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
    const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null)
    const [currentAddress, setCurrentAddress] = useState<Address>({
        label: '',
        addressFirstName: '',
        addressLastName: '',
        street: '',
        apartment: '',
        city: '',
        emirates: 'dubai',
        country: 'United Arab Emirates',
        phoneNumber: ''
    })

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/users/me')
                if (!res.ok) {
                    window.location.href = '/login'
                    return
                }
                const data = await res.json()
                if (!data.user) {
                    window.location.href = '/login'
                    return
                }
                const u = data.user as UserProfile
                setUser(u)
                setPersonalInfo({
                    firstName: u.firstName || '',
                    lastName: u.lastName || '',
                    phone: u.phone || '',
                    gender: u.gender || ''
                })
                setAddresses(u.addresses || [])
            } catch (error) {
                console.error('Failed to fetch user:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [])

    const handleSaveProfile = async () => {
        if (!user) return
        setSaving(true)
        setMessage(null)

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...personalInfo,
                    addresses
                })
            })

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' })
                setTimeout(() => setMessage(null), 3000)
            } else {
                setMessage({ type: 'error', text: 'Failed to update profile.' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred while saving.' })
        } finally {
            setSaving(false)
        }
    }

    const openAddressModal = (index: number | null = null) => {
        if (index !== null) {
            setEditingAddressIndex(index)
            setCurrentAddress({ ...addresses[index] })
        } else {
            setEditingAddressIndex(null)
            setCurrentAddress({
                label: '',
                addressFirstName: personalInfo.firstName,
                addressLastName: personalInfo.lastName,
                street: '',
                apartment: '',
                city: '',
                emirates: 'dubai',
                country: 'United Arab Emirates',
                phoneNumber: personalInfo.phone
            })
        }
        setIsAddressModalOpen(true)
    }

    const saveAddress = () => {
        if (editingAddressIndex !== null) {
            const newAddresses = [...addresses]
            newAddresses[editingAddressIndex] = currentAddress
            setAddresses(newAddresses)
        } else {
            setAddresses([...addresses, currentAddress])
        }
        setIsAddressModalOpen(false)
    }

    const deleteAddress = (index: number) => {
        if (confirm('Are you sure you want to delete this address?')) {
            const newAddresses = addresses.filter((_, i) => i !== index)
            setAddresses(newAddresses)
        }
    }

    if (loading) return <div className={styles.loading}>Preparing your profile...</div>

    return (
        <div className={styles.container}>
            <div className="container">
                <div className={styles.profileCard}>
                    <header className={styles.header}>
                        <h1 className={styles.title}>My Profile</h1>
                        <p className={styles.subtitle}>Manage your personal information and addresses</p>
                    </header>

                    {message && (
                        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} mb-4`}>
                            {message.text}
                        </div>
                    )}

                    {/* Personal Details */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <span>👤</span> Personal Details
                        </h2>
                        <div className={styles.grid}>
                            <div className={styles.formGroup}>
                                <label>First Name</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={personalInfo.firstName}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={personalInfo.lastName}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    className={styles.input}
                                    value={user?.email || ''}
                                    disabled
                                    title="Email cannot be changed"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    className={styles.input}
                                    value={personalInfo.phone}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Gender</label>
                                <select
                                    className={styles.select}
                                    value={personalInfo.gender}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Addresses */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <span>📍</span> Saved Addresses
                        </h2>
                        <div className={styles.addressGrid}>
                            {addresses.map((addr, idx) => (
                                <div key={idx} className={styles.addressCard}>
                                    <h4 className={styles.addressLabel}>{addr.label || 'Home'}</h4>
                                    <p className={styles.addressText}>
                                        {addr.addressFirstName} {addr.addressLastName}<br />
                                        {addr.street}, {addr.apartment}<br />
                                        {addr.city}, {addr.emirates.replace('_', ' ')}
                                    </p>
                                    <div className={styles.addressActions}>
                                        <button className={styles.textBtn} onClick={() => openAddressModal(idx)}>Edit</button>
                                        <button className={`${styles.textBtn} ${styles.textBtnDanger}`} onClick={() => deleteAddress(idx)}>Delete</button>
                                    </div>
                                </div>
                            ))}
                            {addresses.length < 5 && (
                                <button className={styles.addBtn} onClick={() => openAddressModal()}>
                                    <span>➕</span> Add New Address
                                </button>
                            )}
                        </div>
                    </section>

                    <div className={styles.actions}>
                        <button
                            className={styles.saveBtn}
                            onClick={handleSaveProfile}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Address Modal */}
            {isAddressModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2 className={styles.sectionTitle}>
                            {editingAddressIndex !== null ? 'Edit Address' : 'Add New Address'}
                        </h2>
                        <div className={styles.grid}>
                            <div className={styles.formGroup}>
                                <label>Label (e.g. Home, Office)</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={currentAddress.label}
                                    onChange={(e) => setCurrentAddress({ ...currentAddress, label: e.target.value })}
                                    placeholder="Home"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>First Name</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={currentAddress.addressFirstName}
                                    onChange={(e) => setCurrentAddress({ ...currentAddress, addressFirstName: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={currentAddress.addressLastName}
                                    onChange={(e) => setCurrentAddress({ ...currentAddress, addressLastName: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Street Address</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={currentAddress.street}
                                    onChange={(e) => setCurrentAddress({ ...currentAddress, street: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Apartment/Villa No.</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={currentAddress.apartment}
                                    onChange={(e) => setCurrentAddress({ ...currentAddress, apartment: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>City</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={currentAddress.city}
                                    onChange={(e) => setCurrentAddress({ ...currentAddress, city: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Emirate</label>
                                <select
                                    className={styles.select}
                                    value={currentAddress.emirates}
                                    onChange={(e) => setCurrentAddress({ ...currentAddress, emirates: e.target.value })}
                                >
                                    <option value="abu_dhabi">Abu Dhabi</option>
                                    <option value="dubai">Dubai</option>
                                    <option value="sharjah">Sharjah</option>
                                    <option value="ajman">Ajman</option>
                                    <option value="umm_al_quwain">Umm Al Quwain</option>
                                    <option value="ras_al_khaimah">Ras Al Khaimah</option>
                                    <option value="fujairah">Fujairah</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    className={styles.input}
                                    value={currentAddress.phoneNumber}
                                    onChange={(e) => setCurrentAddress({ ...currentAddress, phoneNumber: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className={styles.actions}>
                            <button className={styles.textBtn} onClick={() => setIsAddressModalOpen(false)}>Cancel</button>
                            <button className={styles.saveBtn} onClick={saveAddress}>Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
