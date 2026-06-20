import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Heart, Clock, Utensils, HeartHandshake } from 'lucide-react';
import FoodAreaHeader from '@/components/food/FoodAreaHeader';

export default function CommunityLunch() {
  const { data: orders = [] } = useQuery({ queryKey: ['food-orders'], queryFn: () => base44.entities.FoodOrder.list() });
  
  // Community lunch orders are those with order_type 'delivery' or notes mentioning community lunch
  const communityOrders = orders.filter(o => o.order_type === 'delivery' || (o.notes || '').toLowerCase().includes('community'));
  const mealsServed = communityOrders.filter(o => o.status === 'completed').length;
  const upcomingMeals = communityOrders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length;

  return (
    <div>
      <FoodAreaHeader area="community-lunch" />
      
      {/* Program Overview */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">Community Lunch Program</h1>
              <p className="text-gray-600 text-lg leading-relaxed">
                A free, hot meal served to members of our community every week. Many rely on this program 
                not just for nourishment, but for connection, dignity, and a sense of belonging.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-xl p-5 border border-blue-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Utensils className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">What We Provide</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                A nutritious hot meal, prepared with care by our kitchen team and volunteers. No questions asked, no barriers — everyone is welcome.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-blue-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Who It's For</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Anyone in the community who needs a meal. This includes individuals experiencing food insecurity, seniors on fixed incomes, and anyone seeking connection.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-blue-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <HeartHandshake className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Get Involved</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                We welcome volunteers to help prepare, serve, and clean up. Contact our Food Services coordinator to learn more about volunteer opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Metrics */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">Program Impact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <Utensils className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Meals Served</div>
                <div className="text-2xl font-bold text-gray-900">{mealsServed}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Upcoming Meals</div>
                <div className="text-2xl font-bold text-gray-900">{upcomingMeals}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Community Connection</div>
                <div className="text-2xl font-bold text-gray-900">Weekly</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Schedule & Info */}
      <section className="max-w-6xl mx-auto px-6 pb-10">
        <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">Schedule & Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-blue-600" />
                Serving Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Day</span>
                <span className="text-sm font-semibold text-gray-900">Every Wednesday</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Time</span>
                <span className="text-sm font-semibold text-gray-900">12:00 PM - 1:30 PM</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Location</span>
                <span className="text-sm font-semibold text-gray-900">Candora Community Hall</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-blue-600" />
                Contact & Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                For questions about the Community Lunch program, volunteering, or special dietary needs, please contact:
              </p>
              <div className="bg-blue-50 rounded-lg p-4 mt-3">
                <p className="text-sm text-gray-700 font-medium">Food Services Coordinator</p>
                <p className="text-sm text-gray-600 mt-1">Available through the main Food Services dashboard</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}