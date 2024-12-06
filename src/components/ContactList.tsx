import { FC } from "react";
import { Contact } from "../types/message";
import { shortenAddress } from "../utils/wallet";
import { MessageSquare } from "lucide-react";

interface ContactsListProps {
  contacts: Contact[];
  onSelectContact: (address: string) => void;
  selectedAddress?: string;
}

export const ContactsList: FC<ContactsListProps> = ({
  contacts,
  onSelectContact,
  selectedAddress,
}) => {
  return (
    <div className="border-r border-[#383838] w-80 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Messages</h2>
        <div className="space-y-2">
          {contacts.map((contact) => (
            <button
              key={contact.address}
              onClick={() => onSelectContact(contact.address)}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                selectedAddress === contact.address
                  ? "bg-[#9945FF] text-white"
                  : "hover:bg-[#383838] text-gray-300"
              }`}
            >
              <div className="bg-[#2C2C2C] p-2 rounded-full">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">{shortenAddress(contact.address)}</p>
                {contact.lastMessage && (
                  <p className="text-sm text-gray-400 truncate">
                    {contact.lastMessage.content}
                  </p>
                )}
              </div>
              {contact.unreadCount > 0 && (
                <span className="bg-[#14F195] text-black text-xs font-bold px-2 py-1 rounded-full">
                  {contact.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
