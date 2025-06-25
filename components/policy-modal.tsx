"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PolicyModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'terms' | 'privacy' | 'refund' | 'contact'
}

export function PolicyModal({ isOpen, onClose, type }: PolicyModalProps) {
  const getContent = () => {
    switch (type) {
      case 'terms':
        return {
          title: "Terms of Service",
          content: (
            <div className="prose prose-gray max-w-none">
              <p className="text-sm text-gray-600 mb-6">
                Last Updated: {new Date().toLocaleDateString('en-US')}
              </p>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="mb-4">
                  Welcome to MaogePDF ("we," "our," or "the service"). By accessing or using our service, you agree to be bound by these Terms of Service ("Terms").
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">2. Service Description</h2>
                <p className="mb-4">
                  MaogePDF is an AI-powered PDF document analysis and conversation platform providing the following features:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>PDF document upload and parsing</li>
                  <li>AI-based document Q&A</li>
                  <li>Document content search and analysis</li>
                  <li>Plus membership premium features</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">3. Plus Membership Service</h2>
                <p className="mb-4">
                  Plus membership provides the following premium services:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Unlimited PDF uploads and processing</li>
                  <li>Unlimited AI conversations</li>
                  <li>Support for large documents up to 2000 pages</li>
                  <li>Up to 50 PDFs per folder</li>
                  <li>High-quality AI model access</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">4. Paid Services</h2>
                <p className="mb-4">
                  Plus membership offers two payment options:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Monthly: $11.99/month, automatically renews monthly</li>
                  <li>Annual: $86.40/year, automatically renews annually (save 40%)</li>
                </ul>
                <p className="mb-4">
                  All paid services are processed through the Paddle secure payment platform. Subscriptions will automatically renew until you cancel.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">5. Cancellation and Refunds</h2>
                <p className="mb-4">
                  You may cancel your Plus membership subscription at any time. After cancellation, you will continue to enjoy Plus features until the end of the current billing cycle.
                </p>
                <p className="mb-4">
                  We offer a 7-day no-questions-asked refund guarantee. For refunds, please contact customer service: maogepdf@163.com
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">6. User Responsibilities</h2>
                <p className="mb-4">
                  Users agree to:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Only upload documents you have legal rights to</li>
                  <li>Not upload files containing malware or illegal content</li>
                  <li>Not abuse the service or attempt to bypass usage restrictions</li>
                  <li>Protect your account security</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">7. Privacy Protection</h2>
                <p className="mb-4">
                  We value your privacy. Please review our Privacy Policy to understand how we collect, use, and protect your information.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">8. Service Changes</h2>
                <p className="mb-4">
                  We reserve the right to modify or terminate the service at any time. Major changes will be communicated to users in advance.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">9. Contact Us</h2>
                <p className="mb-4">
                  If you have any questions, please contact us:
                </p>
                <ul className="list-none mb-4">
                  <li>Company: Sichuan Keji Internet Information Service Co., Ltd.</li>
                  <li>Address: No. 337 Langui Avenue, Dongxing District, Neijiang City, Sichuan Province, China (Incubator)</li>
                  <li>Email: maogepdf@163.com</li>
                  <li>Website: https://maogepdf.com</li>
                </ul>
              </section>
            </div>
          )
        }

      case 'privacy':
        return {
          title: "Privacy Policy",
          content: (
            <div className="prose prose-gray max-w-none">
              <p className="text-sm text-gray-600 mb-6">
                Last Updated: {new Date().toLocaleDateString('en-US')}
              </p>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">1. Information Collection</h2>
                <p className="mb-4">
                  We collect the following types of information:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li><strong>Account Information</strong>: Email address, username, and other registration information</li>
                  <li><strong>Usage Data</strong>: PDF documents you upload, conversation records, usage statistics</li>
                  <li><strong>Technical Information</strong>: IP address, browser type, device information</li>
                  <li><strong>Payment Information</strong>: Processed through Paddle, we do not store payment card information</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">2. Information Use</h2>
                <p className="mb-4">
                  We use collected information to:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Provide and improve service functionality</li>
                  <li>Process your PDF documents and AI conversation requests</li>
                  <li>Manage your account and subscription</li>
                  <li>Send service-related notifications</li>
                  <li>Analyze service usage to optimize performance</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">3. Data Storage</h2>
                <p className="mb-4">
                  Your data is stored in the following locations:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li><strong>Document Storage</strong>: Supabase cloud database (encrypted storage)</li>
                  <li><strong>AI Processing</strong>: Processed through OpenRouter API, not stored long-term</li>
                  <li><strong>User Data</strong>: Supabase Authentication system</li>
                  <li><strong>Payment Data</strong>: Paddle payment platform (PCI DSS compliant)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">4. Data Sharing</h2>
                <p className="mb-4">
                  We do not sell your personal information to third parties. We may share data in the following situations:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li><strong>Service Providers</strong>: Supabase, OpenRouter, Paddle, and other technical service providers</li>
                  <li><strong>Legal Requirements</strong>: Compliance with laws and regulations or judicial processes</li>
                  <li><strong>Security Protection</strong>: Protecting user and service security</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">5. Data Security</h2>
                <p className="mb-4">
                  We implement the following security measures to protect your data:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Data transmission and storage encryption</li>
                  <li>Access control and authentication</li>
                  <li>Regular security audits</li>
                  <li>Employee data protection training</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">6. Your Rights</h2>
                <p className="mb-4">
                  You have the following rights:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li><strong>Access Right</strong>: View the personal information we hold about you</li>
                  <li><strong>Correction Right</strong>: Request correction of inaccurate information</li>
                  <li><strong>Deletion Right</strong>: Request deletion of your personal information</li>
                  <li><strong>Data Portability</strong>: Obtain your data in a structured format</li>
                  <li><strong>Withdraw Consent</strong>: Withdraw consent to data processing at any time</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">7. Contact Us</h2>
                <p className="mb-4">
                  For privacy-related questions, please contact us:
                </p>
                <ul className="list-none mb-4">
                  <li>Company: Sichuan Keji Internet Information Service Co., Ltd.</li>
                  <li>Address: No. 337 Langui Avenue, Dongxing District, Neijiang City, Sichuan Province, China (Incubator)</li>
                  <li>Email: maogepdf@163.com</li>
                  <li>Customer Service: maogepdf@163.com</li>
                  <li>Website: https://maogepdf.com</li>
                </ul>
              </section>
            </div>
          )
        }

      case 'refund':
        return {
          title: "Refund Policy",
          content: (
            <div className="prose prose-gray max-w-none">
              <p className="text-sm text-gray-600 mb-6">
                Last Updated: {new Date().toLocaleDateString('en-US')}
              </p>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">1. Refund Guarantee</h2>
                <p className="mb-4">
                  We offer a <strong>7-day no-questions-asked refund guarantee</strong> for MaogePDF Plus membership. If you are not satisfied with our service, you can request a full refund within 7 days of purchase.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">2. Refund Conditions</h2>
                <p className="mb-4">
                  The following situations qualify for refunds:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Request made within 7 days of purchasing Plus membership</li>
                  <li>Technical issues with the service that cannot be resolved promptly</li>
                  <li>Dissatisfaction with service features</li>
                  <li>Accidental duplicate purchases</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">3. Refund Process</h2>
                <p className="mb-4">
                  To request a refund, please follow these steps:
                </p>
                <ol className="list-decimal pl-6 mb-4">
                  <li>Send an email to <strong>maogepdf@163.com</strong></li>
                  <li>Email subject: Plus Membership Refund Request</li>
                  <li>Provide the following information:
                    <ul className="list-disc pl-6 mt-2">
                      <li>Registered email address</li>
                      <li>Purchase date</li>
                      <li>Paddle order number (if available)</li>
                      <li>Reason for refund</li>
                    </ul>
                  </li>
                  <li>We will respond with processing results within 1-2 business days</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">4. Refund Timeline</h2>
                <p className="mb-4">
                  Refund processing time:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li><strong>Review Time</strong>: 1-2 business days after receiving request</li>
                  <li><strong>Processing Time</strong>: Processed through Paddle payment platform, usually 3-5 business days</li>
                  <li><strong>Settlement Time</strong>: Depending on your payment method, may take an additional 1-7 business days</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">5. Partial Refunds</h2>
                <p className="mb-4">
                  The following situations may qualify for partial refunds:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Annual subscribers requesting refunds after using the service for several months</li>
                  <li>Compensation for losses due to service interruptions</li>
                  <li>Negotiated solutions in special circumstances</li>
                </ul>
                <p className="mb-4">
                  Partial refund amounts will be calculated based on actual usage time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">6. Non-Refundable Situations</h2>
                <p className="mb-4">
                  The following situations do not qualify for refunds:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Requests made after the 7-day refund period</li>
                  <li>Heavy usage of Plus features (such as processing large numbers of PDF documents)</li>
                  <li>Account suspension due to violation of terms of service</li>
                  <li>Inability to use service due to user's own network issues</li>
                  <li>Dissatisfaction with free version features</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">7. Contact Customer Service</h2>
                <p className="mb-4">
                  For refund-related questions, please contact:
                </p>
                <ul className="list-none mb-4">
                  <li><strong>Company</strong>: Sichuan Keji Internet Information Service Co., Ltd.</li>
                  <li><strong>Address</strong>: No. 337 Langui Avenue, Dongxing District, Neijiang City, Sichuan Province, China (Incubator)</li>
                  <li><strong>Email</strong>: maogepdf@163.com</li>
                  <li><strong>Subject</strong>: Plus Membership Refund Request</li>
                  <li><strong>Response Time</strong>: 1-2 business days</li>
                </ul>
                <p className="mb-4">
                  We are committed to providing friendly, professional customer service to ensure your issues are resolved promptly.
                </p>
              </section>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Tip</h3>
                <p className="text-blue-800 text-sm">
                  We recommend trying all features immediately after purchasing Plus membership to ensure the service meets your needs. If you have any questions, please contact our customer service team promptly.
                </p>
              </div>
            </div>
          )
        }

      case 'contact':
        return {
          title: "Contact Us",
          content: (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Contact Information */}
                <div>
                  <h2 className="text-xl font-semibold mb-6">Contact Information</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.947a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Customer Service Email</h3>
                        <p className="text-gray-600">maogepdf@163.com</p>
                        <p className="text-sm text-gray-500 mt-1">We respond within 1-2 business days</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Official Website</h3>
                        <p className="text-gray-600">https://maogepdf.com</p>
                        <p className="text-sm text-gray-500 mt-1">Visit our website to learn more features</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Customer Service Hours</h3>
                        <p className="text-gray-600">Monday to Friday 9:00-18:00</p>
                        <p className="text-sm text-gray-500 mt-1">Beijing Time (UTC+8)</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Company Information</h3>
                        <p className="text-gray-600">Sichuan Keji Internet Information Service Co., Ltd.</p>
                        <p className="text-sm text-gray-500 mt-1">No. 337 Langui Avenue, Dongxing District, Neijiang City, Sichuan Province, China (Incubator)</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-900 mb-2">🚀 Plus Member Exclusive Support</h3>
                    <p className="text-yellow-800 text-sm">
                      Plus members enjoy priority customer support with an average response time of no more than 12 hours.
                    </p>
                  </div>
                </div>

                {/* FAQ */}
                <div>
                  <h2 className="text-xl font-semibold mb-6">Frequently Asked Questions</h2>
                  
                  <div className="space-y-4">
                    <details className="group">
                      <summary className="flex justify-between items-center cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="font-medium">How to upgrade to Plus membership?</span>
                        <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="mt-2 p-4 text-sm text-gray-600">
                        Click on the avatar in the top right corner → My Account → Upgrade button, choose monthly or annual plan. Supports credit card, PayPal and other payment methods.
                      </div>
                    </details>

                    <details className="group">
                      <summary className="flex justify-between items-center cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="font-medium">What to do if PDF processing fails?</span>
                        <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="mt-2 p-4 text-sm text-gray-600">
                        Please check if the PDF file size exceeds the limit (10MB max for free version, Plus members support larger files). If the problem persists, please contact customer service with error screenshots.
                      </div>
                    </details>

                    <details className="group">
                      <summary className="flex justify-between items-center cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="font-medium">How to cancel Plus subscription?</span>
                        <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="mt-2 p-4 text-sm text-gray-600">
                        You can manage subscriptions on the My Account page, or send an email to maogepdf@163.com to request cancellation. After cancellation, you can still use Plus features until the current cycle ends.
                      </div>
                    </details>

                    <details className="group">
                      <summary className="flex justify-between items-center cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="font-medium">How is data security guaranteed?</span>
                        <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="mt-2 p-4 text-sm text-gray-600">
                        We use enterprise-grade encrypted storage, and all data transmission uses HTTPS encryption. You can delete uploaded documents at any time, and we will not share your file content with third parties.
                      </div>
                    </details>
                  </div>
                </div>
              </div>

              {/* Support Types */}
              <div>
                <h2 className="text-xl font-semibold mb-6">How can we help you?</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="font-medium mb-2">Technical Support</h3>
                    <p className="text-sm text-gray-600">Feature usage issues, error reports, performance optimization suggestions</p>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h3 className="font-medium mb-2">Payment Support</h3>
                    <p className="text-sm text-gray-600">Subscription management, payment issues, refund requests, invoice needs</p>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="font-medium mb-2">Product Suggestions</h3>
                    <p className="text-sm text-gray-600">Feature suggestions, product feedback, partnership inquiries, API integration</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-900 mb-2">🆘 Emergency Situations</h3>
                <p className="text-red-800 text-sm">
                  For account security issues, data loss, or other emergencies, please immediately send an email to 
                  <strong> maogepdf@163.com</strong>, and we will prioritize handling your case.
                </p>
              </div>
            </div>
          )
        }

      default:
        return { title: "", content: null }
    }
  }

  const { title, content } = getContent()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="px-6 pb-6 max-h-[calc(90vh-100px)]">
          {content}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}