import type { CollectionConfig } from 'payload'
import { afterUserCreated } from './hooks/afterUserCreated'
import { beforeUserDelete } from './hooks/beforeUserDelete'
import { validateReferralCode } from './hooks/validateReferralCode'
import { changeEmailOtpApp } from './endpoints/changeEmailOtpApp'
import { changeEmailOtpWeb } from './endpoints/changeEmailOtpWeb'
import { verifyChangeEmailApp } from './endpoints/verifyChangeEmailApp'
import { verifyChangeEmailWeb } from './endpoints/verifyChangeEmailWeb'
import { getAddresses, addAddress, updateAddress, deleteAddress } from './endpoints/manageAddresses'
import { uploadProfileImage } from './endpoints/uploadProfileImage'
import { validateReferral } from './endpoints/validateReferral'

export const Users: CollectionConfig = {
  slug: 'users',

  auth: {
    tokenExpiration: 60 * 60 * 24 * 7,
  },
  admin: {
    useAsTitle: 'email',
  },

  endpoints: [
    {
      path: '/app-change-email',
      method: 'post',
      handler: changeEmailOtpApp,
    },
    {
      path: '/web-change-email',
      method: 'post',
      handler: changeEmailOtpWeb,
    },
    {
      path: '/app-verify-change-email',
      method: 'post',
      handler: verifyChangeEmailApp,
    },
    {
      path: '/web-verify-change-email',
      method: 'post',
      handler: verifyChangeEmailWeb,
    },
    {
      path: '/:id/addresses',
      method: 'get',
      handler: getAddresses,
    },
    {
      path: '/:id/addresses',
      method: 'post',
      handler: addAddress,
    },
    {
      path: '/:id/addresses',
      method: 'patch',
      handler: updateAddress,
    },
    {
      path: '/:id/addresses',
      method: 'delete',
      handler: deleteAddress,
    },
    {
      path: '/upload-profile-image',
      method: 'post',
      handler: uploadProfileImage,
    },
    {
      path: '/validate-referral',
      method: 'post',
      handler: validateReferral,
    },
  ],

  hooks: {
    beforeChange: [validateReferralCode],

    afterChange: [
      afterUserCreated, // Your existing hook
      async ({ doc, operation, req }) => {
        // Only run on creation and if barcodeToken hasn't been set yet
        if (operation === 'create' && !doc.barcodeToken) {
          try {
            const { encrypt } = await import('@/lib/crypto')
            const encryptedBarcode = encrypt(doc.id.toString())

            const urlSafeToken = encryptedBarcode
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=+$/, '');

            await req.payload.update({
              collection: 'users',
              id: doc.id,
              data: {
                barcodeToken: urlSafeToken,
              },
              req, // CRITICAL: Pass req to stay in the same transaction
              context: {
                preventAfterChange: true,
              },
            })
          } catch (error) {
            console.error('Error generating barcodeToken in afterChange:', error)
          }
        }
      },
    ],
    beforeDelete: [beforeUserDelete],
  },
  access: {
    create: () => true,
    read: () => true,
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'super-admin') return true
      if (req.user.role === 'admin') return true
      // Regular customers can only update their own document
      return {
        id: { equals: req.user.id },
      }
    },
    delete: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'super-admin') return true
      if (req.user.role === 'admin') return true
      // Regular customers can only delete their own document
      return {
        id: { equals: req.user.id },
      }
    },
  },

  fields: [
    {
      name: 'role',
      type: 'select',
      defaultValue: 'customer',
      options: [{ label: 'Customer', value: 'customer' }],
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'text',
    },
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
    },
    {
      name: 'profileImage',
      label: 'Profile Image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'stripeCustomerId',
      label: 'Stripe Customer ID',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Automatically set when the user completes their first checkout.',
      },
    },
    {
      name: 'addresses',
      label: 'Addresses',
      type: 'array',
      admin: {
        initCollapsed: true,
      },
      hooks: {
        beforeChange: [
          ({ value }) => {
            if (!value || !Array.isArray(value)) return value

            if (value.length === 0) return value

            // Find the index of the last item the user checked as "Default"
            // We use findLastIndex so if multiple are checked at once, the newest one wins
            let newDefaultIndex = -1
            for (let i = value.length - 1; i >= 0; i--) {
              if (value[i]?.isDefaultAddress === true) {
                newDefaultIndex = i
                break
              }
            }

            // If no default is selected, but addresses exist, make the first one the default
            if (newDefaultIndex === -1 && value.length > 0) {
              newDefaultIndex = 0
            }

            // Map through and ensure ONLY the newDefaultIndex is true, others become false
            return value.map((addr, index) => ({
              ...addr,
              isDefaultAddress: index === newDefaultIndex,
            }))
          },
        ],
      },
      minRows: 0,
      maxRows: 5,
      fields: [
        {
          name: 'label',
          label: 'Label',
          type: 'text',
        },
        {
          name: 'addressFirstName',
          label: 'First Name',
          type: 'text',
        },
        {
          name: 'addressLastName',
          label: 'Last Name',
          type: 'text',
        },
        {
          name: 'street',
          label: 'Street',
          type: 'text',
        },
        {
          name: 'apartment',
          label: 'Apartment',
          type: 'text',
        },
        {
          name: 'city',
          label: 'City',
          type: 'text',
        },
        {
          name: 'emirates',
          label: 'Emirates',
          type: 'select',
          options: [
            { label: 'Abu Dhabi', value: 'abu_dhabi' },
            { label: 'Dubai', value: 'dubai' },
            { label: 'Sharjah', value: 'sharjah' },
            { label: 'Ajman', value: 'ajman' },
            { label: 'Umm Al Quwain', value: 'umm_al_quwain' },
            { label: 'Ras Al Khaimah', value: 'ras_al_khaimah' },
            { label: 'Fujairah', value: 'fujairah' },
          ],
        },
        {
          name: 'country',
          label: 'Country',
          type: 'text',
          defaultValue: 'United Arab Emirates',
          admin: { readOnly: true },
        },
        {
          name: 'phoneNumber',
          label: 'Phone Number',
          type: 'text',
        },
        {
          name: 'isDefaultAddress',
          label: 'Is Default Address',
          type: 'checkbox',
        },
      ],
    },
    {
      name: 'pushToken',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'referralCode',
      type: 'text',
      unique: true,
      admin: {
        description: 'The unique code generated from the user’s first name.',
        readOnly: true,
      },
      hooks: {
        beforeValidate: [
          async ({ data, operation, value }) => {
            // Only run on creation and if a value doesn't already exist
            if (operation === 'create' && !value) {
              const firstName = data?.firstName || 'user'

              // Clean the name: lowercase and remove non-alphanumeric chars
              const cleanName = firstName.toLowerCase().replace(/[^a-z0-9]/g, '')

              // Add a random 4-digit suffix for uniqueness
              const randomSuffix = Math.floor(1000 + Math.random() * 9000)

              return `${cleanName}${randomSuffix}`
            }
            return value
          },
        ],
      },
    },
    {
      name: 'referredBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
    },
    {
      name: 'referralCodeInput', // Only used during signup
      type: 'text',
      admin: { hidden: true }, // We use this in a hook, then discard or ignore
    },
    {
      name: 'referralStatus',
      type: 'select',
      defaultValue: 'not_eligible',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Rewarded', value: 'rewarded' },
        { label: 'Not Eligible', value: 'not_eligible' },
      ],
      admin: {
        readOnly: true,
        description: 'Tracks the state of the referral reward for this user.',
      },
    },
    {
      name: 'barcodeToken',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Token used for generating user-specific barcodes in the mobile app.',
        hidden: true, // Hide from admin UI since it's only relevant for the mobile app and generated automatically
      },
    },
  ],
  lockDocuments: false,
}
