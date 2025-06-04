import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/hooks/use-language"

interface FooterModalProps {
  isOpen: boolean
  onClose: () => void
  type: "terms" | "privacy" | "contact"
}

export function FooterModal({ isOpen, onClose, type }: FooterModalProps) {
  const { t } = useLanguage()
  
  const getTitle = () => {
    switch (type) {
      case "terms":
        return t("termsOfService")
      case "privacy":
        return t("privacyPolicy")
      case "contact":
        return t("contactUs")
      default:
        return ""
    }
  }
  
  const getContent = () => {
    switch (type) {
      case "terms":
        return (
          <div className="space-y-4 text-slate-700">
            <h3 className="text-lg font-semibold">1. Terms of Service</h3>
            <p>Welcome to Maoge PDF ("Service"). By accessing or using our service, you agree to be bound by these terms.</p>
            
            <h3 className="text-lg font-semibold">2. Conditions of Use</h3>
            <p>You must comply with all applicable laws and regulations posted on our website. You may not use our service for any illegal or unauthorized purpose.</p>
            
            <h3 className="text-lg font-semibold">3. Intellectual Property</h3>
            <p>The service and its original content, features, and functionality are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>
            
            <h3 className="text-lg font-semibold">4. User Accounts</h3>
            <p>When you create an account, you must provide accurate, complete, and up-to-date information. You are responsible for safeguarding your account and password.</p>
            
            <h3 className="text-lg font-semibold">5. Service Changes</h3>
            <p>We reserve the right to modify or terminate the service at any time without notice. We shall not be liable to you or any third party.</p>
            
            <h3 className="text-lg font-semibold">6. Disclaimer</h3>
            <p>Our service is provided on an "as is" and "as available" basis without any warranties, expressed or implied.</p>
            
            <h3 className="text-lg font-semibold">7. Limitation of Liability</h3>
            <p>In no event shall we be liable for any loss or damage arising from the use of or inability to use our service.</p>
            
            <h3 className="text-lg font-semibold">8. Changes to Terms</h3>
            <p>We reserve the right to modify these terms at any time. After modifications, we will post the updated terms on the website.</p>
          </div>
        )
      case "privacy":
        return (
          <div className="space-y-4 text-slate-700">
            <h3 className="text-lg font-semibold">1. Information Collection</h3>
            <p>We may collect personally identifiable information (such as name, email address) and non-personally identifiable information (such as browser type, IP address).</p>
            
            <h3 className="text-lg font-semibold">2. Information Usage</h3>
            <p>We use the collected information to provide, maintain, and improve our services, as well as to communicate with you.</p>
            
            <h3 className="text-lg font-semibold">3. Information Protection</h3>
            <p>We adopt reasonable security measures to protect your personal information from unauthorized access or disclosure.</p>
            
            <h3 className="text-lg font-semibold">4. Information Sharing</h3>
            <p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties unless we provide you with advance notice.</p>
            
            <h3 className="text-lg font-semibold">5. Cookies</h3>
            <p>We use cookies to collect information and improve our services. You can choose to refuse cookies, but this may affect certain functionalities of the service.</p>
            
            <h3 className="text-lg font-semibold">6. Third-Party Links</h3>
            <p>Our service may contain links to third-party websites. We are not responsible for the content or privacy policies of these websites.</p>
            
            <h3 className="text-lg font-semibold">7. Children's Privacy</h3>
            <p>Our service does not target children under the age of 13. We do not knowingly collect personally identifiable information from children under 13.</p>
            
            <h3 className="text-lg font-semibold">8. Policy Changes</h3>
            <p>We may update our privacy policy from time to time. We will post any changes on our website.</p>
          </div>
        )
      case "contact":
        return (
          <div className="space-y-4 text-slate-700">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <p>If you have any questions, suggestions, or concerns about our service, please feel free to contact us through the following means:</p>
            
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="font-medium">Email Address:</p>
              <p className="text-[#8b5cf6]">a12311001001@163.com</p>
            </div>
            
            <p>Our team will respond to your inquiries as soon as possible. Typically, we respond within 1-2 business days.</p>
            
            <h3 className="text-lg font-semibold">Feedback</h3>
            <p>We value your feedback and suggestions as they are essential for improving our service. If you have any ideas or suggestions, please feel free to let us know.</p>
          </div>
        )
      default:
        return null
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">{getTitle()}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {getContent()}
        </div>
        <DialogFooter>
          <Button 
            onClick={onClose}
            className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 